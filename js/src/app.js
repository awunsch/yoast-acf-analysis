/* global YoastSEO, acf, _, jQuery, wp */
var config = require( "./config/config.js" );
var helper = require( "./helper.js" );
var collect = require( "./collect/collect.js" );
var replaceVars = require( "./replacevars.js" );

var analysisTimeout = 0;

var App = function() {
	YoastSEO.app.registerPlugin( config.pluginName, { status: "ready" } );

	YoastSEO.app.registerModification( "content", collect.append.bind( collect ), config.pluginName );

	this.bindListeners();
};

/**
 * ACF 4 Listener.
 *
 * @param {Array} fieldSelectors List of field selectors.
 * @param {string} wysiwygSelector Element selector for WYSIWYG fields.
 * @param {Array} fieldSelectorsWithoutWysiwyg List of fields.
 *
 * @returns {void}
 */
App.prototype.acf4Listener = function( fieldSelectors, wysiwygSelector, fieldSelectorsWithoutWysiwyg ) {
	replaceVars.updateReplaceVars( collect );

	var fieldsWithoutWysiwyg = jQuery( "#post-body, #edittag" ).find( fieldSelectorsWithoutWysiwyg.join( "," ) );
	var fields = jQuery( "#post-body, #edittag" ).find( fieldSelectors.join( "," ) );

	fieldsWithoutWysiwyg.on( "change", this.maybeRefresh.bind( this ) );
	// Do not ignore Wysiwyg fields for the purpose of Replace Vars.
	fields.on( "change", replaceVars.updateReplaceVars.bind( this, collect ) );

	if ( YoastSEO.wp._tinyMCEHelper ) {
		jQuery( wysiwygSelector ).each( function() {
			YoastSEO.wp._tinyMCEHelper.addEventHandler( this.id, [ "input", "change", "cut", "paste" ],
				replaceVars.updateReplaceVars.bind( this, collect ) );
		} );
	}

	// Also refresh on media close as attachment data might have changed
	wp.media.frame.on( "close", this.maybeRefresh );
};

/**
 * ACF 5 Listener.
 *
 * @returns {void}
 */
App.prototype.acf5Listener = function() {
	replaceVars.updateReplaceVars( collect );

	var that = this;

	// Use ACF Models introduced in ACF version 5.7.
	/* eslint-disable no-unused-vars */
	var acfModelInstance = new acf.Model( {
		wait: "ready",
		events: {
			input: "onInput",
		},
		onInput: this.refreshAnalysisAndReplaceVars.bind( this ),
	} );
	/* eslint-enable no-unused-vars */

	// The ACF Wysiwyg field needs to be handled after TinyMCE is initialized.
	jQuery( document ).on( "tinymce-editor-init", function( event, editor ) {
		/*
		 * TinyMCE supports the native `input` event but doesn't always fire it
		 * when pasting: added a specific `paste` event. Also, added TinyMCE specific
		 * events to support the undo and redo actions.
		 */
		editor.on( "input paste undo redo", function() {
			that.refreshAnalysisAndReplaceVars();
		} );
	} );

	/*
	 * ACF `append` global action: Triggered when new HTML is added to the page.
	 * For example, when adding a Repeater row or a Flexible content layout.
	 */
	acf.addAction( "append", this.refreshAnalysisAndReplaceVars.bind( this ) );

	/*
	 * ACF `remove` global action: Triggered when HTML is removed from the page.
	 * For example, when removing a Repeater row or a Flexible content layout.
	 */
	acf.addAction( "remove", this.refreshAnalysisAndReplaceVars.bind( this ) );

	/*
	 * ACF `sortstop` global action: Triggered when a field is reordered.
	 * For example, when reordering Repeater rows or Flexible content layouts.
	 */
	acf.addAction( "sortstop", this.refreshAnalysisAndReplaceVars.bind( this ) );
};

App.prototype.refreshAnalysisAndReplaceVars = function() {
	this.maybeRefresh();
	replaceVars.updateReplaceVars.bind( this, collect );
};

App.prototype.bindListeners = function() {
	if ( helper.acf_version >= 5 ) {
		jQuery( this.acf5Listener.bind( this ) );
	} else {
		var fieldSelectors = config.fieldSelectors.slice( 0 );
		var wysiwygSelector = "textarea[id^=wysiwyg-acf]";

		// Ignore Wysiwyg fields because they trigger a refresh in Yoast SEO itself
		var fieldSelectorsWithoutWysiwyg = _.without( fieldSelectors, wysiwygSelector );

		jQuery( document ).on( "acf/setup_fields", this.acf4Listener.bind( this, fieldSelectors, wysiwygSelector, fieldSelectorsWithoutWysiwyg ) );
	}
};

App.prototype.maybeRefresh = function() {
	if ( analysisTimeout ) {
		window.clearTimeout( analysisTimeout );
	}

	analysisTimeout = window.setTimeout( function() {
		if ( config.debug ) {
			/* eslint-disable no-console */
			console.log( "Recalculate..." + new Date() + "(Internal)" );
			/* eslint-enable no-console */
		}

		YoastSEO.app.pluginReloaded( config.pluginName );
	}, config.refreshRate );
};

module.exports = App;
