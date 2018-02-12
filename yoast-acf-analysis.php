<?php
/**
 * @package YoastACFAnalysis
 */

/*
Plugin Name: ACF Content Analysis for Yoast SEO
Plugin URI: https://wordpress.org/plugins/acf-content-analysis-for-yoast-seo/
Description: Ensure that Yoast SEO analyzes all Advanced Custom Fields 4 and 5 content including Flexible Content and Repeaters.
Version: 2.0.1
Author: Thomas Kräftner, ViktorFroberg, marol87, pekz0r, angrycreative, Team Yoast
Author URI: http://angrycreative.se
License: GPL v3
Text Domain: acf-content-analysis-for-yoast-seo
Domain Path: /languages/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'AC_SEO_ACF_ANALYSIS_PLUGIN_PATH' ) ) {
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_SLUG', 'ac-yoast-seo-acf-content-analysis' );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_FILE', __FILE__ );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_URL', plugins_url( '', __FILE__ ) . '/' );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_NAME', untrailingslashit( plugin_basename( __FILE__ ) ) );
}

$autoload_file = '/vendor/autoload.php';

if ( version_compare( PHP_VERSION, '5.3.2', '<' ) ) {
	$autoload_file = '/vendor/autoload_52.php';
}

if ( is_file( AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . $autoload_file ) ) {
	require AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . $autoload_file;
}

/**
 * Loads translations.
 *
 * @deprecated 2.0.1
 */
function yoast_acf_analysis_load_textdomain() {
	// As we require WordPress 4.6 and higher, we don't need to load the translation files manually anymore.
}

/**
 * Triggers a message whenever the class is missing.
 */
if ( ! class_exists( 'AC_Yoast_SEO_ACF_Content_Analysis' ) && is_admin() ) {
	$message = sprintf(
		/* translators: %1$s resolves to ACF Content Analysis for Yoast SEO */
		__( '%1$s could not be loaded because of missing files.', 'acf-content-analysis-for-yoast-seo' ),
		'ACF Content Analysis for Yoast SEO'
	);

	add_action(
		'admin_notices',
		create_function( '', "echo '<div class=\"error\"><p>$message</p></div>';" )
	);
}
else {
	$ac_yoast_seo_acf_analysis = new AC_Yoast_SEO_ACF_Content_Analysis();
	$ac_yoast_seo_acf_analysis->init();
}
