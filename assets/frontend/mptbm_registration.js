// Main variables
const APIKey = "web.f7b6050b20e44b8e9fe0e54ccb482c7f";
const servicesAPIKey = "service.d37f026828334ee2a6040dad9876f31c";
var markersCount = 0;
var markers = [];
var wayDetails;
var markersLayer = [];
var strokes = null;
var isSelectingStartPlace = false;
var isSelectingEndPlace = false;
var latestLocation;

// start up
// showDropdown("mptbm_map_start_place");
// showDropdown("mptbm_map_end_place");

var map = new ol.Map({
  target: "mptbm_map_area",
  key: APIKey, // Use the API key from options
  maptype: "dreamy",
  poi: false,
  traffic: false,
  view: new ol.View({
    center: ol.proj.fromLonLat([51.33807097641315, 35.69978313978797]),
    zoom: 14,
  }),
});

async function addressToLocation(address, theID) {
  let add = await sendFetchRequest(
    `https://api.neshan.org/v4/geocoding?address=${address}`
  );
  locationToMarker(add.location, theID);
}

function locationToMarker(location, theID) {
  addMarker(
    location.x,
    location.y,
    "",
    map,
    "https://platform.neshan.org/wp-content/uploads/2023/10/marker-icon-2x-red.png",
    0.5,
    theID
  );

  markers[theID] = [location.x, location.y];

  map.getView().setCenter(ol.proj.fromLonLat([location.x, location.y]));

  if (markersLayer && markersLayer[0] && markersLayer[1]) {
    distanceAndTime();
  }
}

async function distanceAndTime() {
  wayDetails = await sendFetchRequest(
    `https://api.neshan.org/v4/direction?type=car&origin=${markers[0][1]},${markers[0][0]}&destination=${markers[1][1]},${markers[1][0]}&alternative=false`
  );

  const totalDistance = wayDetails.routes[0].legs[0].distance.value;
  const totalTime = wayDetails.routes[0].legs[0].duration.value;
  const totalDistanceText = wayDetails.routes[0].legs[0].distance.text;
  const totalTimeText = wayDetails.routes[0].legs[0].duration.text;

  // mptbm_set_cookie_distance_duration(
  //   totalDistance,
  //   totalTime,
  //   totalDistanceText,
  //   totalTimeText
  // );

  addArrowToMap();

  // Define the extent (bounding box) that includes both markers
  var extent = ol.extent.boundingExtent([
    ol.proj.fromLonLat([markers[0][0], markers[0][1]]), // First marker
    ol.proj.fromLonLat([markers[1][0], markers[1][1]]), // Second marker
  ]);

  // Fit the view to the extent to make sure both markers are visible
  map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
}

function addArrowToMap() {
  var trackStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 12,
      color: "#250ECDCC",
    }),
  });

  var pointStyle = new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: "#0077FF",
      }),
      stroke: new ol.style.Stroke({
        color: "#FFFFFF",
        width: 2,
      }),
      radius: 5,
    }),
  });

  if (strokes) {
    strokes.forEach((element) => {
      map.removeLayer(element);
    });
  }

  strokes = [];

  for (let k = 0; k < wayDetails.routes.length; k++) {
    for (let j = 0; j < wayDetails.routes[k].legs.length; j++) {
      for (let i = 0; i < wayDetails.routes[k].legs[j].steps.length; i++) {
        step = wayDetails.routes[k].legs[j].steps[i];

        route = new ol.format.Polyline().readGeometry(step["polyline"], {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        point = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat(step["start_location"])
          ),
        });

        point.setStyle(pointStyle);

        feature = new ol.Feature({
          type: "route",
          geometry: route,
        });

        feature.setStyle(trackStyle);

        var vectorSource = new ol.source.Vector({
          features: [feature, point],
        });

        var vectorLayer = new ol.layer.Vector({
          source: vectorSource,
        });

        strokes.push(vectorLayer);

        map.addLayer(vectorLayer);
      }
    }
  }
}

function sendFetchRequest(url, method = "GET", headers = {}, body = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Api-Key": servicesAPIKey,
          ...headers, // Merge custom headers
        },
      };

      if (body) {
        options.body = JSON.stringify(body); // Add body if provided
      }

      const response = await fetch(url, options);

      if (response.ok) {
        const data = await response.json();
        resolve(data);
      } else {
        reject(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function addMarker(
  lon,
  lat,
  name,
  neshanMap,
  iconSrc = "https://platform.neshan.org/wp-content/uploads/2023/10/marker-icon-2x-red.png",
  scale = 0.5,
  theID
) {
  var marker = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
    name: name,
  });

  marker.setStyle(
    new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        scale: scale,
        src: iconSrc,
      }),
    })
  );

  var vectorSource = new ol.source.Vector({
    features: [marker],
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  if (markersLayer && markersLayer[theID]) {
    neshanMap.removeLayer(markersLayer[theID]);
  }

  markersLayer[theID] = vectorLayer;

  neshanMap.addLayer(vectorLayer);
}

function convertPersianNumbersToEnglish(str) {
  const persianNumbers = [
    /۰/g,
    /۱/g,
    /۲/g,
    /۳/g,
    /۴/g,
    /۵/g,
    /۶/g,
    /۷/g,
    /۸/g,
    /۹/g,
  ];
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = 0; i < 10; i++) {
    str = str.replace(persianNumbers[i], englishNumbers[i]);
  }
  return str;
}

// function showDropdown(inputId) {
//   // Create the dropdown option
//   var option = document.createElement("div");
//   option.innerText = "بنویسید یا روی نقشه انتخاب کنید";
//   option.style.padding = "10px";
//   option.style.cursor = "pointer";
//   option.style.display = "none";
//   if (inputId == "mptbm_map_start_place") {
//     option.id = "start_slug";
//   } else {
//     option.id = "end_slug";
//   }
//   option.addEventListener("mouseover", function () {
//     option.style.backgroundColor = "#f1f1f1";
//   });
//   option.addEventListener("mouseout", function () {
//     option.style.backgroundColor = "";
//   });

//   // Get input element
//   var input = document.getElementById(inputId);
//   var slug = input.parentElement;

//   slug.appendChild(option);

//   var map = document.getElementById("mptbm_map_area");

//   // Show dropdown when input is focused
//   input.addEventListener("focus", function (e) {
//     option.style.display = "block";
//     userPointed(e);
//   });

//   // Hide dropdown if clicking outside
//   document.addEventListener("click", function (event) {
//     if (
//       !input.contains(event.target) &&
//       !option.contains(event.target) &&
//       !map.contains(event.target)
//     ) {
//       option.style.display = "none";
//       userUnPoint();
//     }
//   });

//   function userPointed(e) {
//     if (e.target.id == "mptbm_map_start_place") {
//       isSelectingStartPlace = true;
//     } else {
//       isSelectingEndPlace = true;
//     }
//   }

//   function userUnPoint() {
//     isSelectingEndPlace = false;
//     isSelectingStartPlace = false;
//   }
// }

// Event listeners
const startPlaceInput = document.getElementById("mptbm_map_start_place");

// Trigger addressToLocation when the user presses "Enter" or input loses focus
startPlaceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addressToLocation(startPlaceInput.value, 0); // Use debounce to prevent excessive calls
  }
});

startPlaceInput.addEventListener("blur", () => {
  if (startPlaceInput.value != "") {
    addressToLocation(startPlaceInput.value, 0); // Trigger on input losing focus
  }
});

/*DROP





OFF*/

const endPlaceInput = document.getElementById("mptbm_map_end_place");

// Trigger addressToLocation when the user presses "Enter" or input loses focus
endPlaceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addressToLocation(endPlaceInput.value, 1); // Use debounce to prevent excessive calls
  }
});

endPlaceInput.addEventListener("blur", () => {
  if (endPlaceInput.value != "") {
    addressToLocation(endPlaceInput.value, 1); // Trigger on input losing focus
  }
});

/**
 *
 * JQUERY
 *
 */

(function ($) {
  "use strict";

  $(document).on("click", "#mptbm_get_vehicle", function () {
    // selecting DOMs
    let parent = $(this).closest(".mptbm_transport_search_area");
    let mptbm_enable_return_in_different_date = parent
      .find('[name="mptbm_enable_return_in_different_date"]')
      .val();
    let mptbm_enable_filter_via_features = parent
      .find('[name="mptbm_enable_filter_via_features"]')
      .val();
    let target = parent.find(".tabsContentNext");
    let target_date = parent.find("#mptbm_map_start_date");
    let return_target_date = parent.find("#mptbm_map_return_date");
    let target_time = parent.find("#mptbm_map_start_time");
    let return_target_time = parent.find("#mptbm_map_return_time");
    let start_place;
    let end_place;
    let price_based = parent.find('[name="mptbm_price_based"]').val();
    let two_way = parent.find('[name="mptbm_taxi_return"]').val();
    let waiting_time = parent.find('[name="mptbm_waiting_time"]').val();
    let fixed_time = parent.find('[name="mptbm_fixed_hours"]').val();
    let mptbm_enable_view_search_result_page = parent
      .find('[name="mptbm_enable_view_search_result_page"]')
      .val();

    if (price_based === "manual") {
      start_place = document.getElementById("mptbm_manual_start_place");
      end_place = document.getElementById("mptbm_manual_end_place");
    } else {
      start_place = document.getElementById("mptbm_map_start_place");
      end_place = document.getElementById("mptbm_map_end_place");
    }

    // دریافت تاریخ جلالی از فیلد و تبدیل اعداد فارسی به انگلیسی
    var jalaliDate = parent.find("#mptbm_start_date_shamsi").val();

    // تبدیل تاریخ جلالی به میلادی
    var start_date = convertJalaliToGregorian(jalaliDate);

    let return_date;
    let return_time;

    if (
      mptbm_enable_return_in_different_date == "yes" &&
      two_way != 1 &&
      price_based != "fixed_hourly"
    ) {
      return_date = convertJalaliToGregorian(
        convertPersianNumbersToEnglish(return_target_date.val())
      );
      return_time = return_target_time.val();
    } else {
      return_date = start_date;
      return_time = "Not applicable";
    }

    // checkers

    let start_time = target_time.val();
    if (!start_date) {
      target_date.trigger("click");
    } else if (!start_time) {
      parent
        .find("#mptbm_map_start_time")
        .closest(".mp_input_select")
        .find("input.formControl")
        .trigger("click");
    } else if (!return_date) {
      if (mptbm_enable_return_in_different_date == "yes" && two_way != 1) {
        return_target_date.trigger("click");
      }
    } else if (!return_time) {
      if (mptbm_enable_return_in_different_date == "yes" && two_way != 1) {
        parent
          .find("#mptbm_map_return_time")
          .closest(".mp_input_select")
          .find("input.formControl")
          .trigger("click");
      }
    } else if (!start_place.value) {
      start_place.focus();
    } else if (!end_place.value) {
      end_place.focus();
    } else {
      dLoader(parent.find(".tabsContentNext"));
      mptbm_content_refresh(parent);

      // function getGeometryLocation(address, callback) {
      //   var geocoder = new google.maps.Geocoder();
      //   var coordinatesOfPlace = {};
      //   geocoder.geocode({ address: address }, function (results, status) {
      //     if (status === "OK") {
      //       var latitude = results[0].geometry.location.lat();
      //       var longitude = results[0].geometry.location.lng();
      //       coordinatesOfPlace["latitude"] = latitude;
      //       coordinatesOfPlace["longitude"] = longitude;
      //       callback(coordinatesOfPlace);
      //     } else {
      //       console.error(
      //         "Geocode was not successful for the following reason: " + status
      //       );
      //       callback(null);
      //     }
      //   });
      // }

      // function getCoordinatesAsync(address) {
      //   var deferred = $.Deferred();
      //   getGeometryLocation(address, function (coordinates) {
      //     deferred.resolve(coordinates);
      //   });
      //   return deferred.promise();
      // }

      if (price_based == "manual") {
        $.when(
          getCoordinatesAsync(start_place.value),
          getCoordinatesAsync(end_place.value)
        ).done(function (startCoordinates, endCoordinates) {
          if (
            start_place.value &&
            end_place.value &&
            start_date &&
            start_time &&
            return_date &&
            return_time
          ) {
            let actionValue;
            if (!mptbm_enable_view_search_result_page) {
              actionValue = "get_mptbm_map_search_result";
              $.ajax({
                type: "POST",
                url: mp_ajax_url,
                data: {
                  action: actionValue,
                  start_place: start_place.value,
                  start_place_coordinates: startCoordinates,
                  end_place_coordinates: endCoordinates,
                  end_place: end_place.value,
                  start_date: start_date,
                  start_time: start_time,
                  price_based: price_based,
                  two_way: two_way,
                  waiting_time: waiting_time,
                  fixed_time: fixed_time,
                  return_date: return_date,
                  return_time: return_time,
                },
                beforeSend: function () {
                  //dLoader(target);
                },
                success: function (data) {
                  target
                    .append(data)
                    .promise()
                    .done(function () {
                      dLoaderRemove(parent.find(".tabsContentNext"));
                      parent.find(".nextTab_next").trigger("click");
                    });
                },
                error: function (response) {
                  console.log(response);
                },
              });
            } else {
              actionValue = "get_mptbm_map_search_result_redirect";
              $.ajax({
                type: "POST",
                url: mp_ajax_url,
                data: {
                  action: actionValue,
                  start_place: start_place.value,
                  start_place_coordinates: startCoordinates,
                  end_place_coordinates: endCoordinates,
                  end_place: end_place.value,
                  start_date: start_date,
                  start_time: start_time,
                  price_based: price_based,
                  two_way: two_way,
                  waiting_time: waiting_time,
                  fixed_time: fixed_time,
                  return_date: return_date,
                  return_time: return_time,
                  mptbm_enable_view_search_result_page:
                    mptbm_enable_view_search_result_page,
                },
                beforeSend: function () {
                  dLoader(target);
                },
                success: function (data) {
                  var cleanedURL = data.replace(/"/g, ""); // Remove all double quotes from the string
                  window.location.href = cleanedURL; // Redirect to the URL received from the server
                },
                error: function (response) {
                  console.log(response);
                },
              });
            }
          }
        });
      } else {
        if (
          start_place.value &&
          end_place.value &&
          start_date &&
          start_time &&
          return_date &&
          return_time
        ) {
          let actionValue;
          if (!mptbm_enable_view_search_result_page) {
            actionValue = "get_mptbm_map_search_result";
            $.ajax({
              type: "POST",
              url: mp_ajax_url,
              data: {
                action: actionValue,
                start_place: start_place.value,
                end_place: end_place.value,
                start_date: start_date,
                start_time: start_time,
                price_based: price_based,
                two_way: two_way,
                waiting_time: waiting_time,
                fixed_time: fixed_time,
                return_date: return_date,
                return_time: return_time,
              },
              beforeSend: function () {
                //dLoader(target);
              },
              success: function (data) {
                target
                  .append(data)
                  .promise()
                  .done(function () {
                    dLoaderRemove(parent.find(".tabsContentNext"));
                    parent.find(".nextTab_next").trigger("click");
                  });
              },
              error: function (response) {
                console.log(response);
              },
            });
          } else {
            actionValue = "get_mptbm_map_search_result_redirect";
            $.ajax({
              type: "POST",
              url: mp_ajax_url,
              data: {
                action: actionValue,
                start_place: start_place.value,
                end_place: end_place.value,
                start_date: start_date,
                start_time: start_time,
                price_based: price_based,
                two_way: two_way,
                waiting_time: waiting_time,
                fixed_time: fixed_time,
                return_date: return_date,
                return_time: return_time,
                mptbm_enable_view_search_result_page:
                  mptbm_enable_view_search_result_page,
              },
              beforeSend: function () {
                dLoader(target);
              },
              success: function (data) {
                var cleanedURL = data.replace(/"/g, ""); // Remove all double quotes from the string
                window.location.href = cleanedURL; // Redirect to the URL received from the server
              },
              error: function (response) {
                console.log(response);
              },
            });
          }
        }
      }
    }
  });
})(jQuery);

function convertJalaliToGregorian(jalaliDate) {
  var parts = jalaliDate.split("/");
  var jy = parseInt(parts[0]);
  var jm = parseInt(parts[1]);
  var jd = parseInt(parts[2]);

  var gy = jy > 979 ? 1600 : 621;
  jy -= jy > 979 ? 979 : 0;

  var days =
    365 * jy +
    parseInt(jy / 33) * 8 +
    parseInt(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * parseInt(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * parseInt(--days / 36524);
    days %= 36524;

    if (days >= 365) days++;
  }

  gy += 4 * parseInt(days / 1461);
  days %= 1461;

  gy += parseInt(days > 365 ? (days - 1) / 365 : 0);

  days = days > 365 ? (days - 1) % 365 : days;

  var gd = days + 1;
  var gm;

  var sal_a = [
    0,
    31,
    (gy % 4 == 0 && gy % 100 != 0) || gy % 400 == 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];

  return gy + "-" + (gm < 10 ? "0" + gm : gm) + "-" + (gd < 10 ? "0" + gd : gd);
}

function mptbm_content_refresh(parent) {
  parent.find('[name="mptbm_post_id"]').val("");
  parent.find(".mptbm_map_search_result").remove();
  parent.find(".mptbm_order_summary").remove();
  parent.find(".get_details_next_link").slideUp("fast");
}

function mptbm_set_cookie_distance_duration(
  distance,
  duration,
  distanceText,
  durationText
) {
  let now = new Date();
  let expireTime = now.getTime() + 3600 * 1000 * 12;
  now.setTime(expireTime);

  // Set cookies for distance and duration
  document.cookie =
    "mptbm_distance=" + distance + "; expires=" + now + "; path=/; ";
  document.cookie =
    "mptbm_distance_text=" + distanceText + "; expires=" + now + "; path=/; ";
  document.cookie =
    "mptbm_duration=" + duration + "; expires=" + now + "; path=/; ";
  document.cookie =
    "mptbm_duration_text=" + durationText + "; expires=" + now + "; path=/; ";

  // Update UI with the calculated distance and duration
  jQuery(".mptbm_total_distance").html(distanceText);
  jQuery(".mptbm_total_time").html(durationText);
  jQuery(".mptbm_distance_time").slideDown("fast");

  return true;
}

(function ($) {
  $(document).on(
    "click",
    ".mptbm_transport_search_area .mptbm_transport_select",
    function () {
      let $this = $(this);
      let parent = $this.closest(".mptbm_transport_search_area");
      let target_summary = parent.find(".mptbm_transport_summary");
      let target_extra_service = parent.find(".mptbm_extra_service");
      let target_extra_service_summary = parent.find(
        ".mptbm_extra_service_summary"
      );
      target_summary.slideUp(350);
      target_extra_service.slideUp(350).html("");
      target_extra_service_summary.slideUp(350).html("");
      parent.find('[name="mptbm_post_id"]').val("");
      parent.find(".mptbm_checkout_area").html("");
      if ($this.hasClass("active_select")) {
        $this.removeClass("active_select");
        mp_all_content_change($this);
      } else {
        parent
          .find(".mptbm_transport_select.active_select")
          .each(function () {
            $(this).removeClass("active_select");
            mp_all_content_change($(this));
          })
          .promise()
          .done(function () {
            let transport_name = $this.attr("data-transport-name");
            let transport_price = parseFloat(
              $this.attr("data-transport-price")
            );
            let post_id = $this.attr("data-post-id");
            target_summary.find(".mptbm_product_name").html(transport_name);
            target_summary
              .find(".mptbm_product_price")
              .html(mp_price_format(transport_price));
            $this.addClass("active_select");
            mp_all_content_change($this);
            parent
              .find('[name="mptbm_post_id"]')
              .val(post_id)
              .attr("data-price", transport_price)
              .promise()
              .done(function () {
                mptbm_price_calculation(parent);
              });
            $.ajax({
              type: "POST",
              url: mp_ajax_url,
              data: {
                action: "get_mptbm_extra_service",
                post_id: post_id,
              },
              beforeSend: function () {
                dLoader(parent.find(".tabsContentNext"));
              },
              success: function (data) {
                target_extra_service.html(data);
              },
              error: function (response) {
                console.log(response);
              },
            })
              .promise()
              .done(function () {
                $.ajax({
                  type: "POST",
                  url: mp_ajax_url,
                  data: {
                    action: "get_mptbm_extra_service_summary",
                    post_id: post_id,
                  },
                  success: function (data) {
                    target_extra_service_summary
                      .html(data)
                      .promise()
                      .done(function () {
                        target_summary.slideDown(350);
                        target_extra_service.slideDown(350);
                        target_extra_service_summary.slideDown(350);
                        //pageScrollTo(target_extra_service);
                        $("html, body").animate(
                          {
                            scrollTop: ($this
                              .closest(".mptbm_booking_item")
                              .position().top += $this
                              .closest(".mptbm_booking_item")
                              .outerHeight()),
                          },
                          1000
                        );
                        dLoaderRemove(parent.find(".tabsContentNext"));
                      });
                  },
                  error: function (response) {
                    console.log(response);
                  },
                });
              });
          });
      }
    }
  );
  $(document).on(
    "click",
    ".mptbm_transport_search_area .mptbm_price_calculation",
    function () {
      mptbm_price_calculation($(this).closest(".mptbm_transport_search_area"));
    }
  );
  //========Extra service==============//
  $(document).on(
    "change",
    '.mptbm_transport_search_area [name="mptbm_extra_service_qty[]"]',
    function () {
      $(this)
        .closest(".mptbm_extra_service_item")
        .find('[name="mptbm_extra_service[]"]')
        .trigger("change");
    }
  );
  $(document).on(
    "change",
    '.mptbm_transport_search_area [name="mptbm_extra_service[]"]',
    function () {
      let parent = $(this).closest(".mptbm_transport_search_area");
      let service_name = $(this).data("value");
      let service_value = $(this).val();
      if (service_value) {
        let qty = $(this)
          .closest(".mptbm_extra_service_item")
          .find('[name="mptbm_extra_service_qty[]"]')
          .val();
        parent
          .find('[data-extra-service="' + service_name + '"]')
          .slideDown(350)
          .find(".ex_service_qty")
          .html("x" + qty);
      } else {
        parent.find('[data-extra-service="' + service_name + '"]').slideUp(350);
      }
      mptbm_price_calculation(parent);
    }
  );
  //===========================//
  $(document).on(
    "click",
    ".mptbm_transport_search_area .mptbm_get_vehicle_prev",
    function () {
      var mptbmTemplateExists = $(".mptbm-show-search-result").length;
      if (mptbmTemplateExists) {
        // Function to retrieve cookie value by name
        function getCookie(name) {
          // Split the cookies by semicolon
          var cookies = document.cookie.split(";");
          // Loop through each cookie to find the one with the specified name
          for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Check if the cookie starts with the specified name
            if (cookie.startsWith(name + "=")) {
              // Return the value of the cookie
              return cookie.substring(name.length + 1);
            }
          }
          // Return null if the cookie is not found
          return null;
        }
        // Usage example:
        var httpReferrerValue = getCookie("httpReferrer");
        // Function to delete a cookie by setting its expiry date to a past time
        function deleteCookie(name) {
          document.cookie =
            name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        deleteCookie("httpReferrer");
        window.location.href = httpReferrerValue;
      } else {
        let parent = $(this).closest(".mptbm_transport_search_area");
        parent.find(".get_details_next_link").slideDown("fast");
        parent.find(".nextTab_prev").trigger("click");
      }
    }
  );
  $(document).on(
    "click",
    ".mptbm_transport_search_area .mptbm_summary_prev",
    function () {
      let mptbmTemplateExists = $(".mptbm-show-search-result").length;
      if (mptbmTemplateExists) {
        $(".mptbm_order_summary").css("display", "none");
        $(".mptbm_map_search_result")
          .css("display", "block")
          .hide()
          .slideDown("slow");
        $(".step-place-order").removeClass("active");
      } else {
        let parent = $(this).closest(".mptbm_transport_search_area");
        parent.find(".nextTab_prev").trigger("click");
      }
    }
  );
  //===========================//
  $(document).on("click", ".mptbm_book_now[type='button']", function () {
    let parent = $(this).closest(".mptbm_transport_search_area");
    let target_checkout = parent.find(".mptbm_checkout_area");
    let start_place = parent.find('[name="mptbm_start_place"]').val();
    let end_place = parent.find('[name="mptbm_end_place"]').val();
    let mptbm_waiting_time = parent.find('[name="mptbm_waiting_time"]').val();
    let mptbm_taxi_return = parent.find('[name="mptbm_taxi_return"]').val();
    let return_target_date = parent.find("#mptbm_map_return_date").val();
    let return_target_time = parent.find("#mptbm_map_return_time").val();
    let mptbm_fixed_hours = parent.find('[name="mptbm_fixed_hours"]').val();
    let post_id = parent.find('[name="mptbm_post_id"]').val();
    let date = parent.find('[name="mptbm_date"]').val();
    let link_id = $(this).attr("data-wc_link_id");
    if (start_place !== "" && end_place !== "" && link_id && post_id) {
      let extra_service_name = {};
      let extra_service_qty = {};
      let count = 0;
      parent.find('[name="mptbm_extra_service[]"]').each(function () {
        let ex_name = $(this).val();
        if (ex_name) {
          extra_service_name[count] = ex_name;
          let ex_qty = parseInt(
            $(this)
              .closest(".mptbm_extra_service_item")
              .find('[name="mptbm_extra_service_qty[]"]')
              .val()
          );
          ex_qty = ex_qty > 0 ? ex_qty : 1;
          extra_service_qty[count] = ex_qty;
          count++;
        }
      });
      $.ajax({
        type: "POST",
        url: mp_ajax_url,
        data: {
          action: "mptbm_add_to_cart",
          //"product_id": post_id,
          link_id: link_id,
          mptbm_start_place: start_place,
          mptbm_end_place: end_place,
          mptbm_waiting_time: mptbm_waiting_time,
          mptbm_taxi_return: mptbm_taxi_return,
          mptbm_fixed_hours: mptbm_fixed_hours,
          mptbm_date: "2024/10/01",
          mptbm_return_date: "2024/10/01",
          mptbm_return_time: return_target_time,
          mptbm_extra_service: extra_service_name,
          mptbm_extra_service_qty: extra_service_qty,
        },
        beforeSend: function () {
          dLoader(parent.find(".tabsContentNext"));
        },
        success: function (data) {
          if ($("<div />", { html: data }).find("div").length > 0) {
            var mptbmTemplateExists = $(".mptbm-show-search-result").length;
            if (mptbmTemplateExists) {
              $(".mptbm_map_search_result").css("display", "none");
              $(".mptbm_order_summary").css("display", "block");
              $(".step-place-order").addClass("active");
            }
            target_checkout
              .html(data)
              .promise()
              .done(function () {
                target_checkout
                  .find(".woocommerce-billing-fields .required")
                  .each(function () {
                    $(this)
                      .closest("p")
                      .find(".input-text , select, textarea ")
                      .attr("required", "required");
                  });
                $(document.body).trigger("init_checkout");
                if ($("body select#billing_country").length > 0) {
                  $("body select#billing_country").select2({});
                }
                if ($("body select#billing_state").length > 0) {
                  $("body select#billing_state").select2({});
                }
                dLoaderRemove(parent.find(".tabsContentNext"));
                parent.find(".nextTab_next").trigger("click");
              });
          } else {
            window.location.href = data;
          }
          convertTextToJalal();
        },
        error: function (response) {
          console.log(response);
        },
      });
    }
  });
})(jQuery);

function mptbm_price_calculation(parent) {
  let target_summary = parent.find(".mptbm_transport_summary");
  let total = 0;
  let post_id = parseInt(parent.find('[name="mptbm_post_id"]').val());
  console.log(post_id);
  if (post_id > 0) {
    total =
      total +
      parseFloat(parent.find('[name="mptbm_post_id"]').attr("data-price"));
    parent.find(".mptbm_extra_service_item").each(function () {
      let service_name = jQuery(this)
        .find('[name="mptbm_extra_service[]"]')
        .val();
      if (service_name) {
        let ex_target = jQuery(this).find('[name="mptbm_extra_service_qty[]');
        let ex_qty = parseInt(ex_target.val());
        let ex_price = ex_target.data("price");
        ex_price = ex_price && ex_price > 0 ? ex_price : 0;
        total = total + parseFloat(ex_price) * ex_qty;
      }
    });
  }
  target_summary
    .find(".mptbm_product_total_price")
    .html(mp_price_format(total));
}

// end up
document.getElementById("mptbm_map_area").style.position = "relative";
document.getElementsByClassName("ol-viewport")[0].style.position = "absolute";

// map.on("click", function (event) {
//   var coordinate = ol.proj.toLonLat(event.coordinate);
//   var lon = coordinate[0];
//   var lat = coordinate[1];

//   latestLocation = { x: lon, y: lat };

//   var startSlug = document.getElementById("start_slug");
//   var endSlug = document.getElementById("end_slug");

//   var startDisplay = window.getComputedStyle(startSlug).display;
//   var endDisplay = window.getComputedStyle(endSlug).display;

//   if (startDisplay == "block" || endDisplay == "block") {
//     userUnPoint();
//     if (startDisplay == "block") {
//       document.getElementById("start_slug").style.display = "none";
//     } else {
//       document.getElementById("end_slug").style.display = "none";
//     }
//     locationToMarker(latestLocation, startDisplay == "block" ? 0 : 1);
//     locationToText(latestLocation, startDisplay == "block" ? 0 : 1);
//   }

//   function userUnPoint() {
//     isSelectingEndPlace = false;
//     isSelectingStartPlace = false;
//   }
// });

async function locationToText(location, id) {
  var request = await sendFetchRequest(
    `https://api.neshan.org/v5/reverse?lat=${location.y}&lng=${location.x}`
  );
  console.log(request);
  var target;
  switch (id) {
    case 0:
      target = document.getElementById("mptbm_map_start_place");
      break;

    case 1:
      target = document.getElementById("mptbm_map_end_place");
      break;

    default:
      break;
  }

  target.value = request.formatted_address;
}

// new code
var myOrigins = [];
var myDestination = [];

document.getElementById("back").addEventListener("click", function () {
  if (myDestination.length > 0) {
    myDestination.pop();
    refreshMarkers(undefined, 1, true);
  } else if (myOrigins.length > 0) {
    myOrigins.pop();
    refreshMarkers(undefined, 0, true);
  }

  changeTheButtonsVisibility();
});

// functions
function getTheCenterLocation() {
  var center = map.getView().getCenter();
  var lonLat = ol.proj.toLonLat(center);

  return { x: lonLat[0], y: lonLat[1] };
}

function refreshMarkers(location, theID, res) {
  if (res) {
    markersLayer.forEach((element) => {
      map.removeLayer(element);
    });
  }

  // add the origins

  var markers = [];

  myOrigins.forEach((element) => {
    var marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([element.x, element.y])),
      name: "مبدا",
    });

    marker.setStyle(
      new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          scale: 0.5,
          src: "https://platform.neshan.org/wp-content/uploads/2023/10/marker-icon-2x-red.png",
        }),
        text: new ol.style.Text({
          text: "مبدا",
          font: "14px IRANSans, sans-serif", // Changed font and size
          fill: new ol.style.Fill({ color: "#000" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
          offsetY: 15, // Position below the marker
        }),
      })
    );

    markers.push(marker);
  });

  // destinations
  myDestination.forEach((element) => {
    var marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([element.x, element.y])),
      name: "مقصد",
    });

    marker.setStyle(
      new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          scale: 0.5,
          src: "https://platform.neshan.org/wp-content/uploads/2023/10/marker-icon-2x-red.png",
        }),
        text: new ol.style.Text({
          text: "مقصد",
          font: "14px IRANSans, sans-serif", // Changed font and size
          fill: new ol.style.Fill({ color: "#000" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
          offsetY: 15, // Position below the marker
        }),
      })
    );

    markers.push(marker);
  });

  var vectorSource = new ol.source.Vector({
    features: markers,
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  markersLayer.push(vectorLayer);

  map.addLayer(vectorLayer);
}

function activedepartureButton() {
  document.getElementById("destinationButton").style.display = "block";
}

/*
















*/

// new mabda button listener

const newMabda = document.getElementById("confirmButton");
const destinationButton = document.getElementById("destinationButton");
const finButton = document.getElementById("finButton");

var OriginText = "";
var destinationText = "";

newMabda.addEventListener("click", function () {
  theStep = 1;
  updateMessage();
  const centerLocation = getTheCenterLocation();
  // add the location to locations
  myOrigins.push(centerLocation);
  activedepartureButton();
  refreshMarkers(centerLocation, 0);
  async function getLocationName() {
    var x = await justLocationToText(centerLocation);
    OriginText += " , " + x;
  }
  getLocationName();
  changeTheButtonsVisibility();
});

destinationButton.addEventListener("click", function () {
  theStep = 2;
  updateMessage();
  hideOriginButtonAndShowFinButton();
  const center = getTheCenterLocation();
  myDestination.push(center);
  refreshMarkers();
  async function getLocationName() {
    var x = await justLocationToText(center);
    destinationText += " , " + x;
  }
  getLocationName();
  changeTheButtonsVisibility();
});

const backButton = document.getElementById("back");
const confirmButton = document.getElementById("confirmButton");
const defaultOriginText = "انتخاب مبدا";
const defaultDestinationText = "انتخاب مقصد";

function changeTheButtonsVisibility() {
  if (myOrigins.length > 0 || myDestination.length > 0) {
    backButton.style.display = "block";
  } else {
    backButton.style.display = "none";
  }

  if (myOrigins.length > 0 && myDestination.length > 0) {
    destinationButton.style.display = "block";
    finButton.style.display = "block";
    confirmButton.style.display = "none";
  } else if (myOrigins.length <= 0 && myDestination.length <= 0) {
    destinationButton.style.display = "none";
    finButton.style.display = "none";
    confirmButton.style.display = "block";
  } else if (myOrigins.length > 0 && myDestination.length <= 0) {
    destinationButton.style.display = "block";
    finButton.style.display = "none";
    confirmButton.style.display = "block";
  }

  // Update button texts dynamically
  confirmButton.textContent =
    myOrigins.length > 0 ? "مبدا بعدی" : defaultOriginText;
  destinationButton.textContent =
    myDestination.length > 0 ? "مقصد بعدی" : defaultDestinationText;
}

finButton.addEventListener("click", function () {
  document.getElementById("nextLevel").style.display = "block";
  document.getElementById("mptbm_map_start_place").value = OriginText;
  document.getElementById("mptbm_map_end_place").value = destinationText;
  calculatePrice();
});

async function justLocationToText(location) {
  var request = await sendFetchRequest(
    `https://api.neshan.org/v5/reverse?lat=${location.y}&lng=${location.x}`
  );
  return request.formatted_address;
}

function hideOriginButtonAndShowFinButton() {
  document.getElementById("confirmButton").style.display = "none";
  document.getElementById("finButton").style.display = "block";
}

const messages = [
  "لطفا مبدا خود را انتخاب کنید",
  "مبدا بعدی یا مقصد را انتخاب کنید",
  "مقصد بعدی یا مرحله بعدی را انتخاب کنید",
];

function updateMessage() {
  document.getElementById("myMessage").innerHTML = messages[theStep];
}

var theStep = 0;

updateMessage();

makemptbm_map_start_placeNotEditable();

function makemptbm_map_start_placeNotEditable() {
  document.getElementById("mptbm_map_start_place").readOnly = true;
  document.getElementById("mptbm_map_end_place").readOnly = true;
}

async function calculatePrice() {
  let totalDis = 0;
  let totalTime = 0;

  var tempLoc = [];
  var counter = 0;

  for (const element of myOrigins) {
    tempLoc[counter] = element;

    if (tempLoc[0] && tempLoc[1]) {
      const { totalDistance, totalTime: time } = await doIt(tempLoc);
      totalDis += totalDistance;
      totalTime += time;
      counter = 0;
    } else {
      counter++;
    }
  }

  for (const element of myDestination) {
    tempLoc[counter] = element;

    if (tempLoc[0] && tempLoc[1]) {
      const { totalDistance, totalTime: time } = await doIt(tempLoc);
      totalDis += totalDistance;
      totalTime += time;
      counter = 0;
    } else {
      counter++;
    }
  }

  let hours = Math.floor(totalTime / 3600);
  let minutes = Math.floor((totalTime % 3600) / 60);
  let timeString =
    hours > 0 ? `${hours} ساعت و ${minutes} دقیقه` : `${minutes} دقیقه`;

  // Convert distance
  let distanceInKm = (totalDis / 1000).toFixed(1); // Convert meters to kilometers
  let distanceString = `${distanceInKm} کیلومتر`;

  mptbm_set_cookie_distance_duration(
    totalDis,
    totalTime,
    distanceString,
    timeString
  );

  async function doIt(el) {
    return await justDistanceAndTime(el);
  }
}

async function justDistanceAndTime(el) {
  console.log(el);
  console.log(el);
  console.log(el[1]);
  const wayDetails = await sendFetchRequest(
    `https://api.neshan.org/v4/direction?type=car&origin=${el[0].y},${el[0].x}&destination=${el[1].y},${el[1].x}&alternative=false`
  );

  const totalDistance = wayDetails.routes[0].legs[0].distance.value;
  const totalTime = wayDetails.routes[0].legs[0].duration.value;

  return { totalDistance, totalTime };
  // mptbm_set_cookie_distance_duration(
  //   totalDistance,
  //   totalTime,
  //   totalDistanceText,
  //   totalTimeText
  // );

  // addArrowToMap();

  // Define the extent (bounding box) that includes both markers
  // var extent = ol.extent.boundingExtent([
  //   ol.proj.fromLonLat([markers[0][0], markers[0][1]]), // First marker
  //   ol.proj.fromLonLat([markers[1][0], markers[1][1]]), // Second marker
  // ]);

  // Fit the view to the extent to make sure both markers are visible
  // map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
}

// document.getElementById("userLoc").addEventListener("click", function () {
//   const locationLayer = new ol.layer.Vector({
//     source: new ol.source.Vector(),
//   });
//   map.addLayer(locationLayer);

//   // Use Geolocation API to get the user's location
//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       const coords = [position.coords.longitude, position.coords.latitude];
//       const transformedCoords = ol.proj.fromLonLat(coords);

//       // Add a marker for the user's location
//       const locationFeature = new ol.Feature({
//         geometry: new ol.geom.Point(transformedCoords),
//       });
//       locationFeature.setStyle(
//         new ol.style.Style({
//           image: new ol.style.Circle({
//             radius: 6,
//             fill: new ol.style.Fill({ color: "blue" }),
//             stroke: new ol.style.Stroke({ color: "white", width: 2 }),
//           }),
//         })
//       );

//       locationLayer.getSource().addFeature(locationFeature);

//       // Center the map on the user's location
//       map.getView().setCenter(transformedCoords);
//       map.getView().setZoom(14);
//     },
//     (error) => {
//       console.error("Error getting location:", error);
//     }
//   );
// });
