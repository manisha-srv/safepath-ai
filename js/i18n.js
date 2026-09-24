// ============================================================
// SafePath AI — Client-Side Multi-Language System (i18n)
// Supporting 5 Major Indian Languages:
// English (en), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn)
// ============================================================

const LANG_STORAGE_KEY = "safepath_lang";

const TRANSLATIONS = {
  en: {
    app_title: "SafePath AI",
    tag_driver: "DRIVER APP",
    tag_dashboard: "CITY DASHBOARD",
    nav_driver: "Driver App",
    nav_dashboard: "City Dashboard",

    // Theme Toggle
    theme_daylight: "Daylight",
    theme_dark: "Dark HUD",

    // Auth
    auth_email_placeholder: "Email",
    auth_password_placeholder: "Password",
    auth_login: "Log In",
    auth_signup: "Sign Up",
    auth_signed_in_as: "Signed in as",
    auth_signout: "Sign Out",

    // Telemetry & Status
    status_not_started: "Sensors not started yet. Tap \"Start Monitoring\" below.",
    status_monitoring: "Monitoring live. Drive normally — hazards log automatically.",
    status_active: "Monitoring Active",
    status_starting: "Starting...",
    start_monitoring_btn: "Start Monitoring",
    status_gyro_unavailable: "Monitoring live (gyroscope not available on this device — using accelerometer only).",
    status_gps_denied: "Location permission denied. Please allow location access.",
    status_gps_unavailable: "GPS is not available on this device/browser.",
    status_motion_denied: "Motion sensor permission denied.",
    status_waiting_gps: "Hazard felt, but waiting for GPS lock to log it...",
    status_back_online: "Back online — syncing queued hazards...",
    queue_badge_text: "{count} hazard{plural} waiting to sync (offline)",

    // Demo & Test tools
    demo_tools_title: "Demo & Test Tools",
    demo_tools_badge: "Indoor Testing Only",
    demo_tools_note: "Automatic Detection Active: Potholes and road damage are detected 100% automatically using motion & gyroscope sensors while driving. This simulation button is intended strictly for indoor demonstrations and QA testing without a moving vehicle.",
    simulate_btn: "Simulate Pothole Hit",
    simulated_hit: "Simulated hit",
    impact_detected: "Impact detected",

    // Photo Evidence & Stream
    photo_evidence_title: "Photo Evidence & Stream",
    photo_dropzone_title: "Snap / Upload Hazard Photo",
    photo_dropzone_desc: "Tap to snap with camera or drag & drop photo",
    photo_dropzone_hint: "Attaches to latest detected hazard",
    photo_privacy_badge: "AI Face-Blur Active",
    photo_privacy_note: "Civilian privacy protected: Faces are automatically blurred on-device with AI before upload.",
    session_stream_title: "Session Photo Stream",
    session_stream_empty: "No hazard photos captured in this session yet.",
    photo_scanning: "Scanning for civilian faces to blur...",
    photo_blurred_count: "{count} face{plural} blurred. Photo attached.",
    photo_no_faces: "No faces detected. Photo attached.",
    photo_filter_error: "Privacy filter loading failed (check connection) — photo not attached.",
    photo_coords: "GPS",
    photo_zoom_hint: "Click to zoom",

    // Hazards Log
    hazards_logged_session: "Hazards Logged This Session",
    no_hazards_session: "No hazards logged yet.",

    // Voice Alerts
    voice_detected: "Caution. Road damage detected. Slow down.",
    voice_ahead: "Caution. Road damage ahead. Slow down.",

    // City Dashboard Stats & Lists
    stat_total: "Hazards Logged",
    stat_today: "Logged Today",
    stat_review: "Pending Review",
    review_title: "Flagged — Pending Review",
    all_hazards_title: "All Reported Hazards",
    no_hazards_dashboard: "No hazards reported yet.",
    reported_gallery_title: "Reported Photo Gallery",
    reported_gallery_desc: "Field photos submitted across city sectors",
    no_photos_gallery: "No photo evidence reported yet.",
    modal_title: "Municipal Evidence Preview",
    modal_close: "Close Preview",
    modal_coordinates: "Coordinates",
    modal_time: "Timestamp",
    modal_status: "Status",

    // Action buttons
    btn_mark_repaired: "Mark Repaired",
    btn_repaired: "Repaired",
    btn_flag: "Flag",
    btn_flagged: "Flagged",
    btn_restore: "Restore (false alarm)",
    btn_dismiss: "Dismiss for good",
    badge_active: "Active",
    badge_review: "Pending review",
    badge_repaired: "Repaired",
    signin_hint_actions: "Sign in above to flag or confirm repairs",
    signin_hint_moderate: "Sign in above to moderate",

    // Hazard Types & Severity
    hazard_pothole: "Pothole",
    hazard_speed_breaker: "Unmarked Speed Breaker",
    severity_minor: "Minor Bump",
    severity_moderate: "Moderate",
    severity_severe: "Severe Crater",

    // Speed Gate
    speed_gate_armed: "Speed Gate: Armed (>15 km/h)",
    speed_gate_gated: "Speed Gate: Gated (<15 km/h — filtering false jostles)",
    speed_gate_ignored: "Jostle ignored: Vehicle speed below 15 km/h",
    speed_gate_bypassed: "Simulated hit (Speed gate bypassed for testing)",

    // Voice Alerts
    voice_pothole_detected: "Caution. Pothole detected. Slow down.",
    voice_speedbreaker_detected: "Caution. Unmarked speed breaker detected. Slow down.",
    voice_severe_detected: "Danger! Severe road crater detected. Slow down immediately.",
    voice_pothole_ahead: "Caution. Pothole ahead. Slow down.",
    voice_speedbreaker_ahead: "Caution. Speed breaker ahead. Slow down.",
    voice_severe_ahead: "Danger! Severe road crater ahead. Slow down immediately.",

    // Cockpit HUD
    hud_btn: "Cockpit HUD",
    hud_title: "Cockpit HUD",
    hud_exit: "Exit HUD",
    hud_road_clear: "ROAD CLEAR AHEAD",
    hud_road_clear_sub: "No hazards within 300 meters",
    hud_distance_in: "{type} in {dist}m",
    hud_session_hazards: "SESSION HAZARDS",
    hud_sensor_status: "SENSOR STATUS",
    hud_night_mode: "NIGHT VISION",

    // Demo Tools
    simulate_pothole_minor: "Simulate Pothole (Minor)",
    simulate_pothole_severe: "Simulate Pothole (Severe Crater)",
    simulate_speedbreaker: "Simulate Speed Breaker",
    test_audio_chime: "Test Audio Chime",

    // Dashboard Stats & Filters
    stat_severe: "Severe Craters",
    stat_speedbreakers: "Speed Breakers",
    filter_all_types: "All Hazard Types",
    filter_potholes: "Potholes Only",
    filter_speedbreakers: "Speed Breakers Only",
    filter_all_severities: "All Severities",
    filter_severe: "Severe Craters (>36 m/s²)",
    filter_moderate: "Moderate (28–36 m/s²)",
    filter_minor: "Minor Bump (22–28 m/s²)"
  },

  hi: {
    app_title: "SafePath AI",
    tag_driver: "ड्राइवर ऐप",
    tag_dashboard: "सिटी डैशबोर्ड",
    nav_driver: "ड्राइवर ऐप",
    nav_dashboard: "सिटी डैशबोर्ड",

    theme_daylight: "दिन का मोड",
    theme_dark: "डार्क HUD",

    auth_email_placeholder: "ईमेल",
    auth_password_placeholder: "पासवर्ड",
    auth_login: "लॉग इन",
    auth_signup: "साइन अप",
    auth_signed_in_as: "लॉग इन हैं:",
    auth_signout: "साइन आउट",

    status_not_started: "सेंसर अभी शुरू नहीं हुए हैं। नीचे \"निगरानी शुरू करें\" पर टैप करें।",
    status_monitoring: "लाइव निगरानी जारी है। सामान्य रूप से ड्राइव करें — गड्ढे स्वतः दर्ज होते हैं।",
    status_active: "निगरानी सक्रिय है",
    status_starting: "शुरू हो रहा है...",
    start_monitoring_btn: "निगरानी शुरू करें",
    status_gyro_unavailable: "लाइव निगरानी (जाइरोस्कोप उपलब्ध नहीं — केवल एक्सेलेरोमीटर का उपयोग हो रहा है)।",
    status_gps_denied: "स्थान अनुमति अस्वीकृत। कृपया GPS चालू करें।",
    status_gps_unavailable: "इस डिवाइस पर GPS उपलब्ध नहीं है।",
    status_motion_denied: "मोशन सेंसर अनुमति अस्वीकृत।",
    status_waiting_gps: "झटका महसूस हुआ, GPS लॉक होने की प्रतीक्षा है...",
    status_back_online: "पुनः ऑनलाइन — कतारबद्ध रिपोर्ट सिंक हो रही हैं...",
    queue_badge_text: "{count} रिपोर्ट ऑफ़लाइन कतार में (सिंक लंबित)",

    demo_tools_title: "डेमो और टेस्ट टूल्स",
    demo_tools_badge: "केवल इनडोर टेस्ट हेतु",
    demo_tools_note: "स्वचालित पहचान सक्रिय: वाहन चलाते समय मोशन और जाइरोस्कोप सेंसर द्वारा सड़क के गड्ढे 100% स्वतः दर्ज होते हैं। यह सिमुलेशन बटन केवल इनडोर प्रदर्शन और परीक्षण के लिए है।",
    simulate_btn: "गड्ढे का झटका सिमुलेट करें",
    simulated_hit: "सिमुलेटेड झटका",
    impact_detected: "गड्ढा दर्ज हुआ",

    photo_evidence_title: "फ़ोटो साक्ष्य एवं लाइव स्ट्रीम",
    photo_dropzone_title: "फ़ोटो खींचें / अपलोड करें",
    photo_dropzone_desc: "कैमरा खोलने के लिए टैप करें या यहाँ फ़ोटो खींचकर लाएं",
    photo_dropzone_hint: "हाल ही में दर्ज गड्ढे के साथ जुड़ेगा",
    photo_privacy_badge: "AI चेहरा-ब्लर सक्रिय",
    photo_privacy_note: "नागरिक गोपनीयता सुरक्षित: अपलोड से पहले चेहरे AI द्वारा स्वतः धुंधले (ब्लर) किए जाते हैं।",
    session_stream_title: "सत्र फ़ोटो स्ट्रीम",
    session_stream_empty: "इस सत्र में अभी कोई फ़ोटो नहीं ली गई है।",
    photo_scanning: "चेहरे पहचान कर धुंधले किए जा रहे हैं...",
    photo_blurred_count: "{count} चेहरा धुंधला किया गया। फ़ोटो संलग्न।",
    photo_no_faces: "कोई चेहरा नहीं दिखा। फ़ोटो संलग्न।",
    photo_filter_error: "गोपनीयता फ़िल्टर लोड नहीं हो सका — फ़ोटो संलग्न नहीं हुई।",
    photo_coords: "GPS",
    photo_zoom_hint: "बड़ा देखने के लिए क्लिक करें",

    hazards_logged_session: "सत्र में दर्ज खतरे",
    no_hazards_session: "अभी कोई खतरा दर्ज नहीं हुआ है।",

    voice_detected: "सावधान! सड़क खराब पाई गई है। कृपया गति धीमी करें।",
    voice_ahead: "सावधान! आगे सड़क खराब है। कृपया गति धीमी करें।",

    stat_total: "कुल दर्ज खतरे",
    stat_today: "आज दर्ज किए गए",
    stat_review: "समीक्षा लंबित",
    review_title: "चिह्नित — समीक्षा लंबित",
    all_hazards_title: "सभी रिपोर्ट किए गए खतरे",
    no_hazards_dashboard: "अभी कोई खतरा रिपोर्ट नहीं हुआ है।",
    reported_gallery_title: "रिपोर्ट की गई फ़ोटो गैलरी",
    reported_gallery_desc: "शहर के विभिन्न क्षेत्रों से प्राप्त साक्ष्य",
    no_photos_gallery: "अभी कोई फ़ोटो साक्ष्य प्राप्त नहीं हुआ।",
    modal_title: "नगरपालिका साक्ष्य पूर्वावलोकन",
    modal_close: "बंद करें",
    modal_coordinates: "निर्देशांक (Coordinates)",
    modal_time: "समय",
    modal_status: "स्थिति",

    btn_mark_repaired: "मरम्मत पूर्ण चिह्नित करें",
    btn_repaired: "मरम्मत पूर्ण",
    btn_flag: "फ़्लैग करें",
    btn_flagged: "चिह्नित",
    btn_restore: "पुनर्स्थापित करें (गलत अलार्म)",
    btn_dismiss: "स्थायी रूप से हटाएं",
    badge_active: "सक्रिय",
    badge_review: "समीक्षाधीन",
    badge_repaired: "मरम्मत पूर्ण",
    signin_hint_actions: "पुष्टि या फ़्लैग करने हेतु ऊपर लॉगिन करें",
    signin_hint_moderate: "समीक्षा करने हेतु ऊपर लॉगिन करें",

    // Hazard Types & Severity
    hazard_pothole: "गड्ढा",
    hazard_speed_breaker: "अचिह्नित स्पीड ब्रेकर",
    severity_minor: "हल्का झटका",
    severity_moderate: "मध्यम",
    severity_severe: "खतरनाक गड्ढा (Severe Crater)",

    // Speed Gate
    speed_gate_armed: "स्पीड गेट: सक्रिय (>15 किमी/घंटा)",
    speed_gate_gated: "स्पीड गेट: निष्क्रिय (<15 किमी/घंटा — झूठे झटके फ़िल्टर)",
    speed_gate_ignored: "झटका नजरअंदाज: गति 15 किमी/घंटा से कम है",
    speed_gate_bypassed: "सिमुलेटेड (स्पीड गेट परीक्षण हेतु बायपास)",

    // Voice Alerts
    voice_pothole_detected: "सावधान! गड्ढा दर्ज हुआ। कृपया गति धीमी करें।",
    voice_speedbreaker_detected: "सावधान! अचिह्नित स्पीड ब्रेकर दर्ज हुआ। गति धीमी करें।",
    voice_severe_detected: "खतरा! बहुत गहरा खतरनाक गड्ढा दर्ज हुआ। तुरंत गति धीमी करें।",
    voice_pothole_ahead: "सावधान! आगे गड्ढा है। गति धीमी करें।",
    voice_speedbreaker_ahead: "सावधान! आगे स्पीड ब्रेकर है। गति धीमी करें।",
    voice_severe_ahead: "खतरा! आगे बहुत गहरा गड्ढा है। तुरंत गति धीमी करें।",

    // Cockpit HUD
    hud_btn: "कॉकपिट HUD",
    hud_title: "कॉकपिट HUD",
    hud_exit: "HUD से बाहर निकलें",
    hud_road_clear: "आगे रास्ता साफ है",
    hud_road_clear_sub: "300 मीटर के दायरे में कोई खतरा नहीं",
    hud_distance_in: "{dist}मी में {type}",
    hud_session_hazards: "सत्र खतरे",
    hud_sensor_status: "सेंसर स्थिति",
    hud_night_mode: "नाइट विज़न",

    // Demo Tools
    simulate_pothole_minor: "गड्ढा सिमुलेट करें (हल्का)",
    simulate_pothole_severe: "गड्ढा सिमुलेट करें (खतरनाक गड्ढा)",
    simulate_speedbreaker: "स्पीड ब्रेकर सिमुलेट करें",
    test_audio_chime: "ऑडियो चाइम टेस्ट करें",

    // Dashboard Stats & Filters
    stat_severe: "गंभीर गड्ढे",
    stat_speedbreakers: "स्पीड ब्रेकर",
    filter_all_types: "सभी प्रकार के खतरे",
    filter_potholes: "केवल गड्ढे",
    filter_speedbreakers: "केवल स्पीड ब्रेकर",
    filter_all_severities: "सभी तीव्रता",
    filter_severe: "खतरनाक गड्ढे (>36 m/s²)",
    filter_moderate: "मध्यम (28–36 m/s²)",
    filter_minor: "हल्का झटका (22–28 m/s²)"
  },

  ta: {
    app_title: "SafePath AI",
    tag_driver: "ஓட்டுநர் செயலி",
    tag_dashboard: "நகர கட்டுப்பாட்டு அறை",
    nav_driver: "ஓட்டுநர் செயலி",
    nav_dashboard: "நகர கட்டுப்பாட்டு அறை",

    theme_daylight: "பகல் பயன்முறை",
    theme_dark: "இருண்ட HUD",

    auth_email_placeholder: "மின்னஞ்சல்",
    auth_password_placeholder: "கடவுச்சொல்",
    auth_login: "உள்நுழைக",
    auth_signup: "பதிவுசெய்க",
    auth_signed_in_as: "உள்நுழைந்துள்ள கணக்கு:",
    auth_signout: "வெளியேறுக",

    status_not_started: "சென்சார்கள் இன்னும் தொடங்கப்படவில்லை. கீழே \"கண்காணிப்பைத் தொடங்கு\" என்பதைத் தட்டவும்.",
    status_monitoring: "நேரடி கண்காணிப்பு செயலில் உள்ளது. சாதாரணமாக ஓட்டவும் — ஆபத்துகள் தானாகப் பதிவாகும்.",
    status_active: "கண்காணிப்பு செயலில் உள்ளது",
    status_starting: "தொடங்குகிறது...",
    start_monitoring_btn: "கண்காணிப்பைத் தொடங்கு",
    status_gyro_unavailable: "நேரடி கண்காணிப்பு (கைரோஸ்கோப் இல்லை — முடுக்கமானி மட்டுமே பயன்படுத்தப்படுகிறது).",
    status_gps_denied: "இருப்பிட அனுமதி மறுக்கப்பட்டது. GPS-ஐ இயக்கவும்.",
    status_gps_unavailable: "இந்த சாதனத்தில் GPS கிடைக்கவில்லை.",
    status_motion_denied: "இயக்க உணரி அனுமதி மறுக்கப்பட்டது.",
    status_waiting_gps: "குண்டும் குழியும் உணரப்பட்டது, GPS பூட்டிற்காகக் காத்திருக்கிறது...",
    status_back_online: "மீண்டும் இணைய இணைப்பு கிடைத்தது — ஒத்திசைக்கப்படுகிறது...",
    queue_badge_text: "{count} ஆபத்துகள் ஆஃப்லைனில் காத்திருக்கின்றன",

    demo_tools_title: "டெமோ மற்றும் சோதனை கருவிகள்",
    demo_tools_badge: "உட்புற சோதனைக்கு மட்டுமே",
    demo_tools_note: "தானியங்கி கண்டறிதல் செயலில் உள்ளது: வாகனம் ஓட்டும் போது சென்சார்கள் மூலம் பள்ளங்கள் 100% தானாகவே கண்டறியப்படும். இந்த பட்டன் உள்ளரங்கு சோதனைகளுக்காக மட்டுமே.",
    simulate_btn: "மாதிரி பள்ளத்தை இயக்குக",
    simulated_hit: "மாதிரி நிகழ்வு",
    impact_detected: "பள்ளம் கண்டறியப்பட்டது",

    photo_evidence_title: "புகைப்பட ஆதாரம் & பதிவு",
    photo_dropzone_title: "புகைப்படம் எடுக்க / பதிவேற்ற",
    photo_dropzone_desc: "புகைப்படம் எடுக்க தட்டவும் அல்லது இழுத்துப் போடவும்",
    photo_dropzone_hint: "சமீபத்திய பள்ளத்துடன் இணைக்கப்படும்",
    photo_privacy_badge: "AI முக மங்கலாக்கல் செயலில் உள்ளது",
    photo_privacy_note: "தனியுரிமை பாதுகாப்பு: பதிவேற்றும் முன் முகங்கள் AI மூலம் தானாகவே மங்கலாக்கப்படும் (Blur).",
    session_stream_title: "அமர்வு புகைப்பட ஓட்டம்",
    session_stream_empty: "இந்த அமர்வில் இன்னும் புகைப்படங்கள் எடுக்கப்படவில்லை.",
    photo_scanning: "முகங்கள் அடையாளம் காணப்பட்டு மங்கலாக்கப்படுகின்றன...",
    photo_blurred_count: "{count} முகம் மங்கலாக்கப்பட்டது. படம் இணைக்கப்பட்டது.",
    photo_no_faces: "முகங்கள் இல்லை. படம் இணைக்கப்பட்டது.",
    photo_filter_error: "தனியுரிமை வடிகட்டியை ஏற்ற முடியவில்லை — படம் இணைக்கப்படவில்லை.",
    photo_coords: "GPS",
    photo_zoom_hint: "பெரிதாக்க கிளிக் செய்க",

    hazards_logged_session: "பதிவான ஆபத்துகள்",
    no_hazards_session: "இந்த அமர்வில் எதுவும் பதிவாகவில்லை.",

    voice_detected: "எச்சரிக்கை! சாலை சேதம் கண்டறியப்பட்டது. வேகத்தை குறைக்கவும்.",
    voice_ahead: "எச்சரிக்கை! முன்னால் சாலை சேதம் உள்ளது. வேகத்தை குறைக்கவும்.",

    stat_total: "பதிவான ஆபத்துகள்",
    stat_today: "இன்று பதிவானவை",
    stat_review: "மறுபரிசீலனைக்குரியவை",
    review_title: "கொடியிடப்பட்டது — பரிசீலனை நிலுவை",
    all_hazards_title: "அனைத்து அறிவிக்கப்பட்ட ஆபத்துகள்",
    no_hazards_dashboard: "ஆபத்துகள் எதுவும் பதிவாகவில்லை.",
    reported_gallery_title: "பெறப்பட்ட புகைப்பட தொகுப்பு",
    reported_gallery_desc: "நகரத்தின் பல்வேறு பகுதிகளிலிருந்து பெறப்பட்ட ஆதாரங்கள்",
    no_photos_gallery: "இன்னும் புகைப்பட ஆதாரங்கள் பதிவாகவில்லை.",
    modal_title: "நகராட்சி ஆதார முன்னோட்டம்",
    modal_close: "மூடுக",
    modal_coordinates: "ஆயத்தொலைவுகள் (GPS)",
    modal_time: "நேரம்",
    modal_status: "நிலை",

    btn_mark_repaired: "சீரமைக்கப்பட்டதாகக் குறி",
    btn_repaired: "சீரமைக்கப்பட்டது",
    btn_flag: "புகாரளி",
    btn_flagged: "கொடியிடப்பட்டது",
    btn_restore: "மீட்டமை (தவறான எச்சரிக்கை)",
    btn_dismiss: "நிரந்தரமாக நீக்கு",
    badge_active: "செயலில்",
    badge_review: "ஆய்வில் உள்ளது",
    badge_repaired: "சீரமைக்கப்பட்டது",
    signin_hint_actions: "செயல்பட மேலே உள்நுழைக",
    signin_hint_moderate: "பரிசீலிக்க மேலே உள்நுழைக",

    // Hazard Types & Severity
    hazard_pothole: "பள்ளம்",
    hazard_speed_breaker: "குறியிடப்படாத வேகத்தடை",
    severity_minor: "சிறிய அதிர்வு",
    severity_moderate: "மிதமான",
    severity_severe: "ஆபத்தான பெரும் பள்ளம்",

    // Speed Gate
    speed_gate_armed: "வேகக் கட்டுப்பாடு: செயலில் (>15 கிமீ/மணி)",
    speed_gate_gated: "வேகக் கட்டுப்பாடு: தடுக்கப்பட்டது (<15 கிமீ/மணி — தவறான அதிர்வுகள் தவிர்க்கப்படும்)",
    speed_gate_ignored: "அதிர்வு நிராகரிக்கப்பட்டது: வேகம் 15 கிமீ/மணிக்கு குறைவாக உள்ளது",
    speed_gate_bypassed: "மாதிரி நிகழ்வு (சோதனைக்காக வேகம் புறக்கணிக்கப்பட்டது)",

    // Voice Alerts
    voice_pothole_detected: "எச்சரிக்கை! பள்ளம் கண்டறியப்பட்டது. வேகத்தை குறைக்கவும்.",
    voice_speedbreaker_detected: "எச்சரிக்கை! குறியிடப்படாத வேகத்தடை கண்டறியப்பட்டது. வேகத்தை குறைக்கவும்.",
    voice_severe_detected: "ஆபத்து! மிக மோசமான பெரும் பள்ளம். உடனே வேகத்தை குறைக்கவும்.",
    voice_pothole_ahead: "எச்சரிக்கை! முன்னால் பள்ளம் உள்ளது. வேகத்தை குறைக்கவும்.",
    voice_speedbreaker_ahead: "எச்சரிக்கை! முன்னால் வேகத்தடை உள்ளது. மெதுவாக செல்லவும்.",
    voice_severe_ahead: "ஆபத்து! முன்னால் பெரும் பள்ளம் உள்ளது. உடனே வேகத்தை குறைக்கவும்.",

    // Cockpit HUD
    hud_btn: "காக்பிட் HUD",
    hud_title: "காக்பிட் HUD",
    hud_exit: "HUD வெளியேறு",
    hud_road_clear: "முன்னால் சாலை தெளிவாக உள்ளது",
    hud_road_clear_sub: "300 மீட்டருக்குள் ஆபத்துகள் இல்லை",
    hud_distance_in: "{dist}மீட்டரில் {type}",
    hud_session_hazards: "பதிவானவை",
    hud_sensor_status: "சென்சார் நிலை",
    hud_night_mode: "இரவு பார்வை",

    // Demo Tools
    simulate_pothole_minor: "பள்ளம் இயக்கு (சிறிய)",
    simulate_pothole_severe: "பள்ளம் இயக்கு (ஆபத்தான பள்ளம்)",
    simulate_speedbreaker: "வேகத்தடை இயக்கு",
    test_audio_chime: "எச்சரிக்கை ஒலி சோதனை",

    // Dashboard Stats & Filters
    stat_severe: "ஆபத்தான பள்ளங்கள்",
    stat_speedbreakers: "வேகத்தடைகள்",
    filter_all_types: "அனைத்து வகைகள்",
    filter_potholes: "பள்ளங்கள் மட்டும்",
    filter_speedbreakers: "வேகத்தடைகள் மட்டும்",
    filter_all_severities: "அனைத்து நிலைகள்",
    filter_severe: "ஆபத்தான பள்ளங்கள் (>36 m/s²)",
    filter_moderate: "மிதமான (28–36 m/s²)",
    filter_minor: "சிறிய அதிர்வு (22–28 m/s²)"
  },

  te: {
    app_title: "SafePath AI",
    tag_driver: "డ్రైవర్ యాప్",
    tag_dashboard: "సిటీ డ్యాష్‌బోర్డ్",
    nav_driver: "డ్రైవర్ యాప్",
    nav_dashboard: "సిటీ డ్యాష్‌బోర్డ్",

    theme_daylight: "పగటి మోడ్",
    theme_dark: "డార్క్ HUD",

    auth_email_placeholder: "ఈమెయిల్",
    auth_password_placeholder: "పాస్‌వర్డ్",
    auth_login: "లాగిన్",
    auth_signup: "సైన్ అప్",
    auth_signed_in_as: "లాగిన్ అయిన ఖాతా:",
    auth_signout: "సైన్ అవుట్",

    status_not_started: "సెన్సార్లు ఇంకా ప్రారంభం కాలేదు. క్రింద \"పర్యవేక్షణ ప్రారంభించు\" నొక్కండి.",
    status_monitoring: "లైవ్ మానిటరింగ్ ప్రారంభమైంది. సాధారణంగా డ్రైవ్ చేయండి — గుంతలు స్వయంచాలకంగా నమోదవుతాయి.",
    status_active: "పర్యవేక్షణ చురుగ్గా ఉంది",
    status_starting: "ప్రారంభమవుతోంది...",
    start_monitoring_btn: "పర్యవేక్షణ ప్రారంభించు",
    status_gyro_unavailable: "లైవ్ పర్యవేక్షణ (గైరోస్కోప్ అందుబాటులో లేదు — యాక్సిలరోమీటర్ మాత్రమే వాడుతోంది).",
    status_gps_denied: "లొకేషన్ అనుమతి నిరాకరించబడింది. దయచేసి GPS ని ఆన్ చేయండి.",
    status_gps_unavailable: "ఈ పరికరంలో GPS అందుబాటులో లేదు.",
    status_motion_denied: "మోషన్ సెన్సార్ అనుమతి నిరాకరించబడింది.",
    status_waiting_gps: "రోడ్డు గుంత గుర్తించబడింది, GPS లాక్ కోసం ఎదురుచూస్తోంది...",
    status_back_online: "తిరిగి ఆన్‌లైన్‌లోకి వచ్చింది — డేటా సింక్ అవుతోంది...",
    queue_badge_text: "{count} రిపోర్టులు ఆఫ్‌లైన్ క్యూలో ఉన్నాయి",

    demo_tools_title: "డెమో & టెస్ట్ టూల్స్",
    demo_tools_badge: "ఇండోర్ టెస్టింగ్ కోసం మాత్రమే",
    demo_tools_note: "స్వయంచాలక గుర్తింపు చురుగ్గా ఉంది: డ్రైవింగ్ సమయంలో మోషన్ సెన్సార్ల ద్వారా గుంతలు 100% ఆటోమేటిక్‌గా గుర్తించబడతాయి. ఈ సిమ్యులేట్ బటన్ కేవలం డెమో & టెస్టింగ్ కోసం మాత్రమే.",
    simulate_btn: "గుంతను అనుకరించండి (Simulate)",
    simulated_hit: "సిమ్యులేటెడ్ దెబ్బ",
    impact_detected: "గుంత గుర్తించబడింది",

    photo_evidence_title: "ఫోటో సాక్ష్యం & లైవ్ స్ట్రీమ్",
    photo_dropzone_title: "ఫోటో తీయండి / అప్‌లోడ్ చేయండి",
    photo_dropzone_desc: "కెమెరా కోసం ట్యాప్ చేయండి లేదా ఫోటోను ఇక్కడ వేయండి",
    photo_dropzone_hint: "తాజాగా నమోదైన గుంతకు జతచేయబడుతుంది",
    photo_privacy_badge: "AI ముఖం-బ్లర్ చురుగ్గా ఉంది",
    photo_privacy_note: "గోప్యతా రక్షణ: అప్‌లోడ్ చేయడానికి ముందు ముఖాలు AI ద్వారా స్వయంచాలకంగా బ్లర్ చేయబడతాయి.",
    session_stream_title: "ప్రస్తుత ఫోటోల స్ట్రీమ్",
    session_stream_empty: "ప్రస్తుత సెషన్‌లో ఇంకా ఎలాంటి ఫోటోలు తీయలేదు.",
    photo_scanning: "ముఖాలను గుర్తించి బ్లర్ చేస్తోంది...",
    photo_blurred_count: "{count} ముఖం బ్లర్ చేయబడింది. ఫోటో జతచేయబడింది.",
    photo_no_faces: "ముఖాలు లేవు. ఫోటో జతచేయబడింది.",
    photo_filter_error: "గోప్యతా ఫిల్టర్ లోడ్ కాలేదు — ఫోటో జతచేయబడలేదు.",
    photo_coords: "GPS",
    photo_zoom_hint: "పెద్దదిగా చూడటానికి క్లిక్ చేయండి",

    hazards_logged_session: "ఈ సెషన్‌లో నమోదైన గుంతలు",
    no_hazards_session: "ఈ సెషన్‌లో ఇంకా ఎలాంటి గుంతలు నమోదు కాలేదు.",

    voice_detected: "హెచ్చరిక! రోడ్డు దెబ్బతిన్నట్లు గుర్తించబడింది. వేగాన్ని తగ్గించండి.",
    voice_ahead: "హెచ్చరిక! ముందు రోడ్డు దెబ్బతింది. వేగాన్ని తగ్గించండి.",

    stat_total: "నమోదైన గుంతలు",
    stat_today: "ఈ రోజు నమోదైనవి",
    stat_review: "సమీక్షలో ఉన్నవి",
    review_title: "ఫ్లాగ్ చేయబడినవి — సమీక్ష పెండింగ్",
    all_hazards_title: "నివేదించబడిన అన్ని గుంతలు",
    no_hazards_dashboard: "ఇంకా ఎలాంటి గుంతలు నమోదు కాలేదు.",
    reported_gallery_title: "నివేదించబడిన ఫోటో గ్యాలరీ",
    reported_gallery_desc: "నగరంలోని వివిధ ప్రాంతాల నుండి వచ్చిన సాక్ష్యాలు",
    no_photos_gallery: "ఇంకా ఎలాంటి ఫోటో ఆధారాలు నివేదించబడలేదు.",
    modal_title: "మునిసిపల్ సాక్ష్యం ప్రివ్యూ",
    modal_close: "మూసివేయి",
    modal_coordinates: "కోఆర్డినేట్లు (GPS)",
    modal_time: "సమయం",
    modal_status: "స్థితి",

    btn_mark_repaired: "మరమ్మతు పూర్తయినట్లు గుర్తించండి",
    btn_repaired: "మరమ్మతు పూర్తయింది",
    btn_flag: "ఫ్లాగ్ చేయండి",
    btn_flagged: "ఫ్లాగ్ చేయబడింది",
    btn_restore: "పునరుద్ధరించండి (తప్పుడు సమాచారం)",
    btn_dismiss: "శాశ్వతంగా తొలగించండి",
    badge_active: "క్రియాశీలం",
    badge_review: "సమీక్షలో ఉంది",
    badge_repaired: "మరమ్మతు చేయబడింది",
    signin_hint_actions: "చర్య తీసుకోవడానికి లాగిన్ అవ్వండి",
    signin_hint_moderate: "సమీక్షించడానికి లాగిన్ అవ్వండి",

    // Hazard Types & Severity
    hazard_pothole: "గుంత",
    hazard_speed_breaker: "గుర్తులేని స్పీడ్ బ్రేకర్",
    severity_minor: "చిన్న కుదుపు",
    severity_moderate: "మధ్యస్థ",
    severity_severe: "తీవ్రమైన ప్రమాదకర గుంత",

    // Speed Gate
    speed_gate_armed: "స్పీడ్ గేట్: సక్రియం (>15 కిమీ/గం)",
    speed_gate_gated: "స్పీడ్ గేట్: పరిమితం (<15 కిమీ/గం — తప్పుడు కుదుపులు ఫిల్టర్ చేయబడతాయి)",
    speed_gate_ignored: "కుదుపు విస్మరించబడింది: వేగం 15 కిమీ/గం కంటే తక్కువ",
    speed_gate_bypassed: "సిమ్యులేట్ చేయబడింది (టెస్టింగ్ కోసం స్పీడ్ గేట్ బైపాస్)",

    // Voice Alerts
    voice_pothole_detected: "హెచ్చరిక! రోడ్డుపై గుంత గుర్తించబడింది. వేగం తగ్గించండి.",
    voice_speedbreaker_detected: "హెచ్చరిక! గుర్తులేని స్పీడ్ బ్రేకర్ గుర్తించబడింది. వేగం తగ్గించండి.",
    voice_severe_detected: "ప్రమాదం! అత్యంత తీవ్రమైన గుంత గుర్తించబడింది. వెంటనే వేగం తగ్గించండి.",
    voice_pothole_ahead: "హెచ్చరిక! ముందుకు గుంత ఉంది. వేగం తగ్గించండి.",
    voice_speedbreaker_ahead: "హెచ్చరిక! ముందుకు స్పీడ్ బ్రేకర్ ఉంది. నెమ్మదిగా వెళ్లండి.",
    voice_severe_ahead: "ప్రమాదం! ముందుకు ప్రమాదకర గుంత ఉంది. వెంటనే వేగం తగ్గించండి.",

    // Cockpit HUD
    hud_btn: "కాక్‌పిట్ HUD",
    hud_title: "కాక్‌పిట్ HUD",
    hud_exit: "HUD నిష్క్రమించు",
    hud_road_clear: "ముందు దారి స్పష్టంగా ఉంది",
    hud_road_clear_sub: "300 మీటర్లలోపు ఎలాంటి అడ్డంకులు లేవు",
    hud_distance_in: "{dist} మీటర్లలో {type}",
    hud_session_hazards: "నమోదైనవి",
    hud_sensor_status: "సెన్సార్ స్థితి",
    hud_night_mode: "నైట్ విజన్",

    // Demo Tools
    simulate_pothole_minor: "గుంత అనుకరణ (చిన్నది)",
    simulate_pothole_severe: "గుంత అనుకరణ (తీవ్రమైన గుంత)",
    simulate_speedbreaker: "స్పీడ్ బ్రేకర్ అనుకరణ",
    test_audio_chime: "హెచ్చరిక శబ్దం పరీక్షించండి",

    // Dashboard Stats & Filters
    stat_severe: "తీవ్రమైన గుంతలు",
    stat_speedbreakers: "స్పీడ్ బ్రేకర్లు",
    filter_all_types: "అన్ని రకాల ప్రమాదాలు",
    filter_potholes: "గుంతలు మాత్రమే",
    filter_speedbreakers: "స్పీడ్ బ్రేకర్లు మాత్రమే",
    filter_all_severities: "అన్ని తీవ్రతలు",
    filter_severe: "తీవ్రమైన గుంతలు (>36 m/s²)",
    filter_moderate: "మధ్యస్థ (28–36 m/s²)",
    filter_minor: "చిన్న కుదుపు (22–28 m/s²)"
  },

  kn: {
    app_title: "SafePath AI",
    tag_driver: "ಚಾಲಕ ಅಪ್ಲಿಕೇಶನ್",
    tag_dashboard: "ನಗರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    nav_driver: "ಚಾಲಕ ಅಪ್ಲಿಕೇಶನ್",
    nav_dashboard: "ನಗರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",

    theme_daylight: "ದಿನದ ಮೋಡ್",
    theme_dark: "ಡಾರ್ಕ್ HUD",

    auth_email_placeholder: "ಇಮೇಲ್",
    auth_password_placeholder: "ಪಾಸ್‌ವರ್ಡ್",
    auth_login: "ಲಾಗಿನ್",
    auth_signup: "ಸೈನ್ ಅಪ್",
    auth_signed_in_as: "ಲಾಗಿನ್ ಆಗಿರುವ ಖಾತೆ:",
    auth_signout: "ಸೈನ್ ಔಟ್",

    status_not_started: "ಸಂವೇದಕಗಳು ಇನ್ನೂ ಪ್ರಾರಂಭವಾಗಿಲ್ಲ. ಕೆಳಗೆ \"ಮೇಲ್ವಿಚಾರಣೆ ಪ್ರಾರಂಭಿಸಿ\" ಟ್ಯಾಪ್ ಮಾಡಿ.",
    status_monitoring: "ಲೈವ್ ಮೇಲ್ವಿಚಾರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ. ಸಾಮಾನ್ಯವಾಗಿ ಚಲಾಯಿಸಿ — ರಸ್ತೆ ಗುಂಡಿಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ದಾಖಲಾಗುತ್ತವೆ.",
    status_active: "ಮೇಲ್ವಿಚಾರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ",
    status_starting: "ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ...",
    start_monitoring_btn: "ಮೇಲ್ವಿಚಾರಣೆ ಪ್ರಾರಂಭಿಸಿ",
    status_gyro_unavailable: "ಲೈವ್ ಮೇಲ್ವಿಚಾರಣೆ (ಗೈರೊಸ್ಕೋಪ್ ಲಭ್ಯವಿಲ್ಲ — ಕೇವಲ ವೇಗೋತ್ಕರ್ಷಕವನ್ನು ಬಳಸಲಾಗುತ್ತಿದೆ).",
    status_gps_denied: "ಸ್ಥಳದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು GPS ಆನ್ ಮಾಡಿ.",
    status_gps_unavailable: "ಈ ಸಾಧನದಲ್ಲಿ GPS ಲಭ್ಯವಿಲ್ಲ.",
    status_motion_denied: "ಚಲನೆಯ ಸಂವೇದಕದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.",
    status_waiting_gps: "ಗುಂಡಿ ಪತ್ತೆಯಾಗಿದೆ, GPS ಲಾಕ್‌ಗಾಗಿ ಕಾಯುತ್ತಿದೆ...",
    status_back_online: "ಮತ್ತೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದೆ — ಸರದಿಯ ಡೇಟಾ ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...",
    queue_badge_text: "{count} ವರದಿಗಳು ಆಫ್‌ಲೈನ್ ಸರದಿಯಲ್ಲಿವೆ",

    demo_tools_title: "ಡೆಮೊ ಮತ್ತು ಪರೀಕ್ಷಾ ಪರಿಕರಗಳು",
    demo_tools_badge: "ಒಳಾಂಗಣ ಪರೀಕ್ಷೆಗೆ ಮಾತ್ರ",
    demo_tools_note: "ಸ್ವಯಂಚಾಲಿತ ಪತ್ತೆ ಸಕ್ರಿಯವಾಗಿದೆ: ವಾಹನ ಚಾಲನೆ ಮಾಡುವಾಗ ಚಲನೆಯ ಸಂವೇದಕಗಳ ಮೂಲಕ ರಸ್ತೆ ಹಾನಿಯನ್ನು 100% ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತದೆ. ಈ ಸಿಮ್ಯುಲೇಶನ್ ಬಟನ್ ಕೇವಲ ಡೆಮೊ ಮತ್ತು ಪರೀಕ್ಷೆಗಾಗಿ ಮಾತ್ರ.",
    simulate_btn: "ರಸ್ತೆ ಗುಂಡಿ ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಿ",
    simulated_hit: "ಸಿಮ್ಯುಲೇಟೆಡ್ ಪೆಟ್ಟು",
    impact_detected: "ಗುಂಡಿ ಪತ್ತೆಯಾಗಿದೆ",

    photo_evidence_title: "ಫೋಟೋ ಸಾಕ್ಷ್ಯ ಮತ್ತು ಲೈವ್ ಸ್ಟ್ರೀಮ್",
    photo_dropzone_title: "ಫೋಟೋ ಸೆರೆಹಿಡಿಯಿರಿ / ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    photo_dropzone_desc: "ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ ಅಥವಾ ಫೋಟೋವನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆಯಿರಿ",
    photo_dropzone_hint: "ಇತ್ತೀಚಿನ ರಸ್ತೆ ಗುಂಡಿಗೆ ಲಗತ್ತಿಸಲಾಗುತ್ತದೆ",
    photo_privacy_badge: "AI ಮುಖ-ಬ್ಲರ್ ಸಕ್ರಿಯವಾಗಿದೆ",
    photo_privacy_note: "ಗೌಪ್ಯತೆ ಸಂರಕ್ಷಣೆ: ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಮೊದಲು ಮುಖಗಳನ್ನು AI ಮೂಲಕ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮಸುಕುಗೊಳಿಸಲಾಗುತ್ತದೆ (Blur).",
    session_stream_title: "ಪ್ರಸ್ತುತ ಅಧಿವೇಶನದ ಫೋಟೋಗಳು",
    session_stream_empty: "ಈ ಅಧಿವೇಶನದಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಫೋಟೋಗಳನ್ನು ತೆಗೆದುಕೊಂಡಿಲ್ಲ.",
    photo_scanning: "ಮುಖಗಳನ್ನು ಗುರುತಿಸಿ ಮಸುಕುಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    photo_blurred_count: "{count} ಮುಖ ಮಸುಕುಗೊಳಿಸಲಾಗಿದೆ. ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ.",
    photo_no_faces: "ಮುಖಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ.",
    photo_filter_error: "ಗೌಪ್ಯತೆ ಫಿಲ್ಟರ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ — ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿಲ್ಲ.",
    photo_coords: "GPS",
    photo_zoom_hint: "ದೊಡ್ಡದಾಗಿ ವೀಕ್ಷಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ",

    hazards_logged_session: "ದಾಖಲಾದ ರಸ್ತೆ ಹಾನಿಗಳು",
    no_hazards_session: "ಈ ಅಧಿವೇಶನದಲ್ಲಿ ಯಾವುದೇ ಹಾನಿ ದಾಖಲಾಗಿಲ್ಲ.",

    voice_detected: "ಎಚ್ಚರಿಕೆ! ರಸ್ತೆ ಹಾನಿ ಪತ್ತೆಯಾಗಿದೆ. ವೇಗವನ್ನು ಕಡಿಮೆ ಮಾಡಿ.",
    voice_ahead: "ಎಚ್ಚರಿಕೆ! ಮುಂದೆ ರಸ್ತೆ ಹಾನಿಯಾಗಿದೆ. ವೇಗವನ್ನು ಕಡಿಮೆ ಮಾಡಿ.",

    stat_total: "ದಾಖಲಾದ ರಸ್ತೆ ಹಾನಿಗಳು",
    stat_today: "ಇಂದು ದಾಖಲಾದವು",
    stat_review: "ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ",
    review_title: "ಫ್ಲ್ಯಾಗ್ ಮಾಡಲಾದವು — ಪರಿಶೀಲನೆ ಬಾಕಿ",
    all_hazards_title: "ಎಲ್ಲಾ ವರದಿಯಾದ ರಸ್ತೆ ಹಾನಿಗಳು",
    no_hazards_dashboard: "ಯಾವುದೇ ರಸ್ತೆ ಹಾನಿ ವರದಿಯಾಗಿಲ್ಲ.",
    reported_gallery_title: "ವರದಿಯಾದ ಫೋಟೋ ಗ್ಯಾಲರಿ",
    reported_gallery_desc: "ನಗರದ ವಿವಿಧ ಭಾಗಗಳಿಂದ ಸ್ವೀಕರಿಸಲಾದ ಸಾಕ್ಷ್ಯಗಳು",
    no_photos_gallery: "ಇನ್ನೂ ಯಾವುದೇ ಫೋಟೋ ಪುರಾವೆಗಳು ವರದಿಯಾಗಿಲ್ಲ.",
    modal_title: "ಪುರಸಭೆಯ ಸಾಕ್ಷ್ಯ ಮುನ್ನೋಟ",
    modal_close: "ಮುಚ್ಚಿ",
    modal_coordinates: "ನಿರ್ದೇಶಾಂಕಗಳು (GPS)",
    modal_time: "ಸಮಯ",
    modal_status: "ಸ್ಥಿತಿ",

    btn_mark_repaired: "ದುರಸ್ತಿ ಎಂದು ಗುರುತಿಸಿ",
    btn_repaired: "ದುರಸ್ತಿ ಮಾಡಲಾಗಿದೆ",
    btn_flag: "ಫ್ಲ್ಯಾಗ್ ಮಾಡಿ",
    btn_flagged: "ಫ್ಲ್ಯಾಗ್ ಮಾಡಲಾಗಿದೆ",
    btn_restore: "ಮರುಸ್ಥಾಪಿಸಿ (ತಪ್ಪು ಎಚ್ಚರಿಕೆ)",
    btn_dismiss: "ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಿ",
    badge_active: "ಸಕ್ರಿಯ",
    badge_review: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    badge_repaired: "ದುರಸ್ತಿಗೊಂಡಿದೆ",
    signin_hint_actions: "ಕ್ರಮ ಕೈಗೊಳ್ಳಲು ಲಾಗಿನ್ ಆಗಿ",
    signin_hint_moderate: "ಪರಿಶೀಲಿಸಲು ಲಾಗಿನ್ ಆಗಿ",

    // Hazard Types & Severity
    hazard_pothole: "ರಸ್ತೆ ಗುಂಡಿ",
    hazard_speed_breaker: "ಗುರುತಿಸದ ಸ್ಪೀಡ್ ಬ್ರೇಕರ್",
    severity_minor: "ಸಣ್ಣ ಆಘಾತ",
    severity_moderate: "ಮಧ್ಯಮ",
    severity_severe: "ಅಪಾಯಕಾರಿ ದೊಡ್ಡ ಗುಂಡಿ",

    // Speed Gate
    speed_gate_armed: "ಸ್ಪೀಡ್ ಗೇಟ್: ಸಕ್ರಿಯ (>15 ಕಿಮೀ/ಗಂ)",
    speed_gate_gated: "ಸ್ಪೀಡ್ ಗೇಟ್: ತಡೆಹಿಡಿಯಲಾಗಿದೆ (<15 ಕಿಮೀ/ಗಂ — ತಪ್ಪು ಆಘಾತಗಳು ನಿರ್ಲಕ್ಷಿಸಲ್ಪಡುತ್ತವೆ)",
    speed_gate_ignored: "ಆಘಾತ ನಿರ್ಲಕ್ಷಿಸಲಾಗಿದೆ: ವೇಗ 15 ಕಿಮೀ/ಗಂಟೆಗಿಂತ ಕಡಿಮೆ",
    speed_gate_bypassed: "ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಲಾಗಿದೆ (ಪರೀಕ್ಷೆಗಾಗಿ ಸ್ಪೀಡ್ ಗೇಟ್ ಬೈಪಾಸ್)",

    // Voice Alerts
    voice_pothole_detected: "ಎಚ್ಚರಿಕೆ! ರಸ್ತೆ ಗುಂಡಿ ಪತ್ತೆಯಾಗಿದೆ. ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    voice_speedbreaker_detected: "ಎಚ್ಚರಿಕೆ! ಗುರುತಿಸದ ಸ್ಪೀಡ್ ಬ್ರೇಕರ್ ಪತ್ತೆಯಾಗಿದೆ. ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    voice_severe_detected: "ಅಪಾಯ! ಅತಿ ದೊಡ್ಡ ಅಪಾಯಕಾರಿ ಗುಂಡಿ ಪತ್ತೆಯಾಗಿದೆ. ತಕ್ಷಣ ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    voice_pothole_ahead: "ಎಚ್ಚರಿಕೆ! ಮುಂದೆ ರಸ್ತೆ ಗುಂಡಿ ಇದೆ. ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    voice_speedbreaker_ahead: "ಎಚ್ಚರಿಕೆ! ಮುಂದೆ ಸ್ಪೀಡ್ ಬ್ರೇಕರ್ ಇದೆ. ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    voice_severe_ahead: "ಅಪಾಯ! ಮುಂದೆ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ. ತಕ್ಷಣ ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",

    // Cockpit HUD
    hud_btn: "ಕಾಕ್‌ಪಿಟ್ HUD",
    hud_title: "ಕಾಕ್‌ಪಿಟ್ HUD",
    hud_exit: "HUD ನಿರ್ಗಮಿಸಿ",
    hud_road_clear: "ಮುಂದಿನ ರಸ್ತೆ ಸ್ಪಷ್ಟವಾಗಿದೆ",
    hud_road_clear_sub: "300 ಮೀಟರ್ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ಹಾನಿ ಇಲ್ಲ",
    hud_distance_in: "{dist} ಮೀಟರ್‌ನಲ್ಲಿ {type}",
    hud_session_hazards: "ದಾಖಲಾದವು",
    hud_sensor_status: "ಸಂವೇದಕ ಸ್ಥಿತಿ",
    hud_night_mode: "ನೈಟ್ ವಿಷನ್",

    // Demo Tools
    simulate_pothole_minor: "ಗುಂಡಿ ಸಿಮ್ಯುಲೇಟ್ (ಸಣ್ಣ)",
    simulate_pothole_severe: "ಗುಂಡಿ ಸಿಮ್ಯುಲೇಟ್ (ದೊಡ್ಡ ಗುಂಡಿ)",
    simulate_speedbreaker: "ಸ್ಪೀಡ್ ಬ್ರೇಕರ್ ಸಿಮ್ಯುಲೇಟ್",
    test_audio_chime: "ಎಚ್ಚರಿಕೆ ಶಬ್ದ ಪರೀಕ್ಷಿಸಿ",

    // Dashboard Stats & Filters
    stat_severe: "ಅಪಾಯಕಾರಿ ಗುಂಡಿಗಳು",
    stat_speedbreakers: "ಸ್ಪೀಡ್ ಬ್ರೇಕರ್‌ಗಳು",
    filter_all_types: "ಎಲ್ಲಾ ರೀತಿಯ ಹಾನಿಗಳು",
    filter_potholes: "ಗುಂಡಿಗಳು ಮಾತ್ರ",
    filter_speedbreakers: "ಸ್ಪೀಡ್ ಬ್ರೇಕರ್‌ಗಳು ಮಾತ್ರ",
    filter_all_severities: "ಎಲ್ಲಾ ತೀವ್ರತೆಗಳು",
    filter_severe: "ಅಪಾಯಕಾರಿ ಗುಂಡಿಗಳು (>36 m/s²)",
    filter_moderate: "ಮಧ್ಯಮ (28–36 m/s²)",
    filter_minor: "ಸಣ್ಣ ಆಘಾತ (22–28 m/s²)"
  }
};

const LANG_VOICE_CODES = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN"
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem(LANG_STORAGE_KEY) || "en";
    if (!TRANSLATIONS[this.currentLang]) {
      this.currentLang = "en";
    }
  }

  getLang() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.currentLang = lang;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    this.applyTranslations();
    document.dispatchEvent(new CustomEvent("safepath-lang-changed", { detail: { lang } }));
  }

  t(key, params = {}) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS["en"];
    let text = dict[key] || TRANSLATIONS["en"][key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${k}}`, "g"), v);
    }
    return text;
  }

  applyTranslations() {
    // 1. Text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = this.t(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // 2. Placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const translation = this.t(key);
      if (translation) {
        el.placeholder = translation;
      }
    });

    // 3. Title tooltips
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      const translation = this.t(key);
      if (translation) {
        el.title = translation;
      }
    });

    // Update select element if present
    const langSelect = document.getElementById("langSelector");
    if (langSelect && langSelect.value !== this.currentLang) {
      langSelect.value = this.currentLang;
    }
  }

  speak(key, params = {}) {
    if (!("speechSynthesis" in window)) return;
    const text = this.t(key, params);
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      const targetCode = LANG_VOICE_CODES[this.currentLang] || "en-IN";
      utter.lang = targetCode;

      // Attempt matching available browser voice for natural inflection
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = targetCode.split("-")[0];
        const match = voices.find(
          (v) =>
            v.lang.toLowerCase() === targetCode.toLowerCase() ||
            v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
        );
        if (match) utter.voice = match;
      }

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }
}

// Global singleton instance
window.i18n = new I18nManager();

document.addEventListener("DOMContentLoaded", () => {
  window.i18n.applyTranslations();

  // Bind any language selector in header
  const langSelect = document.getElementById("langSelector");
  if (langSelect) {
    langSelect.value = window.i18n.getLang();
    langSelect.addEventListener("change", (e) => {
      window.i18n.setLanguage(e.target.value);
    });
  }
});
