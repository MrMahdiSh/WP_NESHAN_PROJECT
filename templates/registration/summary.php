<?php
/*
 * @Author 		engr.sumonazma@gmail.com
 * Copyright: 	mage-people.com
 */
if (!defined('ABSPATH')) {
	die;
} // Cannot access pages directly
$distance = $distance ?? (isset($_COOKIE['mptbm_distance']) ? absint($_COOKIE['mptbm_distance']) : '');
$duration = $duration ?? (isset($_COOKIE['mptbm_duration']) ? absint($_COOKIE['mptbm_duration']) : '');
$label = $label ?? MPTBM_Function::get_name();
$date = $date ?? '';
$start_place = $start_place ?? '';
$end_place = $end_place ?? '';
$two_way = $two_way ?? 1;
$waiting_time = $waiting_time ?? 0;
$fixed_time = $fixed_time ?? '';
$return_date_time = $return_date_time ?? '';
$price_based = $price_based ?? '';

?>
<div class="leftSidebar">
	<div class="">
		<div class="mp_sticky_on_scroll">
			<div class="_dLayout_dFlex_fdColumn_btLight_2">
				<h3><?php esc_html_e('SUMMARY', 'ecab-taxi-booking-manager'); ?></h3>
				<div class="dividerL"></div>

				<h6 class="_mB_xs"><?php esc_html_e('Pickup Date', 'ecab-taxi-booking-manager'); ?></h6>
				<p class="_textLight_1" id="pickUpDate"><?php echo esc_html(explode(" ", $date)[0]); ?></p>
				<div class="dividerL"></div>
				<h6 class="_mB_xs"><?php esc_html_e('Pickup Time', 'ecab-taxi-booking-manager'); ?></h6>
				<p class="_textLight_1"><?php echo esc_html(MP_Global_Function::date_format($date, 'time')); ?></p>
				<div class="dividerL"></div>
				<h6 class="_mB_xs"><?php esc_html_e('Pickup Location', 'ecab-taxi-booking-manager'); ?></h6>
				<?php if ($price_based == 'manual') { ?>
					<p class="_textLight_1 mptbm_manual_start_place"><?php echo esc_html(MPTBM_Function::get_taxonomy_name_by_slug($start_place, 'locations')); ?></p>
				<?php } else { ?>
					<p class="_textLight_1 mptbm_manual_start_place"><?php echo esc_html($start_place); ?></p>
				<?php } ?>
				<div class="dividerL"></div>
				<h6 class="_mB_xs"><?php esc_html_e('Drop-Off Location', 'ecab-taxi-booking-manager'); ?></h6>
				<?php if ($price_based == 'manual') { ?>
					<p class="_textLight_1 mptbm_map_end_place"><?php echo esc_html(MPTBM_Function::get_taxonomy_name_by_slug($end_place, 'locations')); ?></p>
				<?php } else { ?>
					<p class="_textLight_1 mptbm_map_end_place"><?php echo esc_html($end_place); ?></p>
				<?php } ?>

				<?php if ($two_way > 1) {
				?>
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php esc_html_e('Transfer Type', 'ecab-taxi-booking-manager'); ?></h6>
					<p class="_textLight_1"><?php esc_html_e('Return', 'ecab-taxi-booking-manager'); ?></p>
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php esc_html_e('Return Date', 'ecab-taxi-booking-manager'); ?></h6>
					<p class="_textLight_1"><?php echo esc_html(MP_Global_Function::date_format($return_date_time)); ?></p>
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php esc_html_e('Return Time', 'ecab-taxi-booking-manager'); ?></h6>
					<p class="_textLight_1"><?php echo esc_html(MP_Global_Function::date_format($return_date_time, 'time')); ?></p>
				<?php } ?>
				<?php if ($waiting_time > 0) { ?>
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php esc_html_e('Extra Waiting Hours', 'ecab-taxi-booking-manager'); ?></h6>
					<p class="_textLight_1"><?php echo esc_html($waiting_time); ?>&nbsp;<?php esc_html_e('Hours', 'ecab-taxi-booking-manager'); ?></p>
				<?php } ?>
				<?php if ($fixed_time && $fixed_time > 0) { ?>
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php esc_html_e('Service Times', 'ecab-taxi-booking-manager'); ?></h6>
					<p class="_textLight_1"><?php echo esc_html($fixed_time); ?> &nbsp;<?php esc_html_e('Hours', 'ecab-taxi-booking-manager'); ?></p>
				<?php } ?>
				<div class="mptbm_transport_summary">
					<div class="dividerL"></div>
					<h6 class="_mB_xs"><?php echo esc_html($label) . ' ' . esc_html__(' Details', 'ecab-taxi-booking-manager') ?></h6>
					<div class="_textColor_4 justifyBetween">
						<div class="_dFlex_alignCenter">
							<span class="fas fa-check-square _textTheme_mR_xs"></span>
							<span class="mptbm_product_name"></span>
						</div>
						<span class="mptbm_product_price _textTheme"></span>
					</div>
					<div class="mptbm_extra_service_summary"></div>
					<div class="dividerL"></div>
					<div class="justifyBetween">
						<h4><?php esc_html_e('Total : ', 'ecab-taxi-booking-manager'); ?></h4>
						<h6 class="mptbm_product_total_price"></h6>
					</div>
				</div>
			</div>
			<div class="divider"></div>
			<button type="button" class="_mpBtn_fullWidth mptbm_get_vehicle_prev">
				<span>&longleftarrow; &nbsp;<?php esc_html_e('Previous', 'ecab-taxi-booking-manager'); ?></span>
			</button>
		</div>
	</div>
</div>

<script>
	var date = document.getElementById("pickUpDate").textContent.trim();

	convertTextToJalal();

	function convertTextToJalal() {
		if (containsPersianMonth(date)) {
			var monthMapping = {
				"ژانویه": 1,
				"فوریه": 2,
				"مارس": 3,
				"آوریل": 4,
				"مه": 5,
				"ژوئن": 6,
				"ژوئیه": 7,
				"اوت": 8,
				"سپتامبر": 9,
				"اکتبر": 10,
				"نوامبر": 11,
				"دسامبر": 12
			};

			// Split and convert the input string:
			var parts = date.split(" ");
			var monthName = parts[0];
			var day = parseInt(parts[1].replace(",", ""));
			var year = parseInt(parts[2]);

			var monthNumber = monthMapping[monthName];

			var jalali = gregorianToJalali(year, monthNumber, day);

			document.getElementById("pickUpDate").textContent = jalali[0] + "/" + jalali[1] + "/" + jalali[2];

		}

	}

	function gregorianToJalali(gy, gm, gd) {
		const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		let jy, days, jm, jd;

		if (gy > 1600) {
			jy = 979;
			gy -= 1600;
		} else {
			jy = 0;
			gy -= 621;
		}
		let gy2 = (gm > 2) ? gy + 1 : gy;
		days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd;
		for (let i = 0; i < gm; i++) {
			days += g_d_m[i];
		}
		jy += 33 * Math.floor(days / 12053);
		days %= 12053;
		jy += 4 * Math.floor(days / 1461);
		days %= 1461;
		if (days > 365) {
			jy += Math.floor((days - 1) / 365);
			days = (days - 1) % 365;
		}
		jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
		jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));

		return [jy, jm, jd];
	}

	function containsPersianMonth(date) {
		const persianMonths = [
			'مارس', 'آوریل', 'مه', 'ژوئن', 'جولای', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر', 'ژانویه', 'فوریه'
		];

		// Check if the date string includes at least one of the Persian month names
		return persianMonths.some(month => date.includes(month));
	}
</script>
<?php
