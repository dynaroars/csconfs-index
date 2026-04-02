var perYearData = null;
var BASELINE_CONFERENCE = "ICLR";
var DEFAULT_BASELINE_AREA = "Machine learning";
var DEFAULT_METRIC_MODE = "effort";

function getMetricMode() {
    var el = document.getElementById("metric-mode");
    if (!el) return DEFAULT_METRIC_MODE;
    return el.value || DEFAULT_METRIC_MODE;
}

function getMetricLabel(metricMode) {
    if (metricMode === "impact") return "Impact";
    if (metricMode === "combined") return "Combined";
    return "Effort";
}

function getCheckedAreas() {
    var checked = {};
    var checkboxes = document.querySelectorAll('.area-checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
        var cb = checkboxes[i];
        if (cb.checked) {
            checked[cb.getAttribute('data-area')] = true;
        }
    }
    return checked;
}

function getCheckedConferences() {
    var checked = {};
    var checkboxes = document.querySelectorAll('.conf-checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
        var cb = checkboxes[i];
        if (cb.checked) {
            checked[cb.getAttribute('data-conf')] = true;
        }
    }
    return checked;
}

function setAllCheckboxes(checked) {
    var allCheckboxes = document.querySelectorAll('.filter-checkbox');
    for (var i = 0; i < allCheckboxes.length; i++) {
        allCheckboxes[i].checked = checked;
    }
}

function updateChildCheckboxes(parentValue, checked) {
    var areaCheckboxes = document.querySelectorAll('.area-checkbox[data-parent="' + parentValue + '"]');
    for (var i = 0; i < areaCheckboxes.length; i++) {
        areaCheckboxes[i].checked = checked;
        var areaValue = areaCheckboxes[i].getAttribute('data-area');
        var confCheckboxes = document.querySelectorAll('.conf-checkbox[data-area="' + areaValue + '"]');
        for (var j = 0; j < confCheckboxes.length; j++) {
            confCheckboxes[j].checked = checked;
        }
    }
}

function updateConferenceCheckboxes(areaValue, checked) {
    var confCheckboxes = document.querySelectorAll('.conf-checkbox[data-area="' + areaValue + '"]');
    for (var i = 0; i < confCheckboxes.length; i++) {
        confCheckboxes[i].checked = checked;
    }
}

function updateParentCheckboxState(parentValue) {
    var areaCheckboxes = document.querySelectorAll('.area-checkbox[data-parent="' + parentValue + '"]');
    var allChecked = true;
    var anyChecked = false;
    for (var i = 0; i < areaCheckboxes.length; i++) {
        if (areaCheckboxes[i].checked) {
            anyChecked = true;
        } else {
            allChecked = false;
        }
    }
    var parentCheckbox = document.querySelector('.parent-checkbox[data-parent="' + parentValue + '"]');
    if (parentCheckbox) {
        parentCheckbox.checked = anyChecked;
        parentCheckbox.indeterminate = anyChecked && !allChecked;
    }
}

function updateAreaCheckboxState(areaValue) {
    var confCheckboxes = document.querySelectorAll('.conf-checkbox[data-area="' + areaValue + '"]');
    var allChecked = true;
    var anyChecked = false;
    for (var i = 0; i < confCheckboxes.length; i++) {
        if (confCheckboxes[i].checked) {
            anyChecked = true;
        } else {
            allChecked = false;
        }
    }
    var areaCheckbox = document.querySelector('.area-checkbox[data-area="' + areaValue + '"]');
    if (areaCheckbox) {
        areaCheckbox.checked = anyChecked;
        areaCheckbox.indeterminate = anyChecked && !allChecked;
        var parentValue = areaCheckbox.getAttribute('data-parent');
        updateParentCheckboxState(parentValue);
    }
}

function setupFilterCheckboxes() {
    var selectAllBtn = document.getElementById('select-all-btn');
    var deselectAllBtn = document.getElementById('deselect-all-btn');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            setAllCheckboxes(true);
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            setAllCheckboxes(false);
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }
    
    var parentCheckboxes = document.querySelectorAll('.parent-checkbox');
    for (var i = 0; i < parentCheckboxes.length; i++) {
        parentCheckboxes[i].addEventListener('change', function(e) {
            var parentValue = e.target.getAttribute('data-parent');
            updateChildCheckboxes(parentValue, e.target.checked);
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }
    
    var areaCheckboxes = document.querySelectorAll('.area-checkbox');
    for (var i = 0; i < areaCheckboxes.length; i++) {
        areaCheckboxes[i].addEventListener('change', function(e) {
            var areaValue = e.target.getAttribute('data-area');
            var parentValue = e.target.getAttribute('data-parent');
            updateConferenceCheckboxes(areaValue, e.target.checked);
            updateParentCheckboxState(parentValue);
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }
    
    var confCheckboxes = document.querySelectorAll('.conf-checkbox');
    for (var i = 0; i < confCheckboxes.length; i++) {
        confCheckboxes[i].addEventListener('change', function(e) {
            var areaValue = e.target.getAttribute('data-area');
            updateAreaCheckboxState(areaValue);
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }
}

function isConferenceViewEnabled() {
    var el = document.getElementById("conference-view-toggle");
    return !!(el && el.checked);
}

function isTrendViewEnabled() {
    var el = document.getElementById("trend-view-toggle");
    return !!(el && el.checked);
}

function populateYearDropdowns() {
    var fromSelect = document.getElementById("from-year");
    var toSelect = document.getElementById("to-year");
    var currentYear = new Date().getFullYear();
    
    var defaultFrom = currentYear - 10;
    for (var year = 1970; year <= currentYear; year++) {
        var option1 = document.createElement("option");
        option1.value = year;
        option1.text = year;
        if (year === defaultFrom) option1.selected = true;
        fromSelect.appendChild(option1);
        
        var option2 = document.createElement("option");
        option2.value = year;
        option2.text = year;
        if (year === currentYear) option2.selected = true;
        toSelect.appendChild(option2);
    }
}

function populateBaselineDropdown(areas) {
    var select = document.getElementById("baseline-dropbox");
    select.innerHTML = "";
    
    var sortedAreas = areas.sort();
    for (var i = 0; i < sortedAreas.length; i++) {
        var option = document.createElement("option");
        option.value = sortedAreas[i];
        option.text = sortedAreas[i];
        if (sortedAreas[i] === DEFAULT_BASELINE_AREA) option.selected = true;
        select.appendChild(option);
    }
}

function getAvailableConferences() {
    if (!perYearData || !perYearData.years_by_conference) return [];
    var set = {};
    for (var yearStr in perYearData.years_by_conference) {
        var yearData = perYearData.years_by_conference[yearStr];
        for (var conf in yearData) set[conf] = true;
    }
    return Object.keys(set).sort();
}

function populateBaselineConferenceDropdown(conferences) {
    var select = document.getElementById("baseline-conference-dropbox");
    if (!select) return;
    select.innerHTML = "";
    for (var i = 0; i < conferences.length; i++) {
        var option = document.createElement("option");
        option.value = conferences[i];
        option.text = conferences[i];
        if (conferences[i] === BASELINE_CONFERENCE) option.selected = true;
        select.appendChild(option);
    }
}

function loadPerYearData() {
    if (perYearData !== null) {
        return Promise.resolve(perYearData);
    }
    
    return fetch("per_year_data.json")
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(function(data) {
            perYearData = data;
            return data;
        });
}

function computeFractionalFaculty(areaToFaculty) {
    var facultyToAreas = {};

    for (var area in areaToFaculty) {
        var facultyMembers = areaToFaculty[area];
        for (var i = 0; i < facultyMembers.length; i++) {
            var faculty = facultyMembers[i];
            if (!facultyToAreas[faculty]) {
                facultyToAreas[faculty] = [];
            }
            facultyToAreas[faculty].push(area);
        }
    }
    var areaToFractionalFacultyCount = {};
    for (var faculty in facultyToAreas) {
        var areas = facultyToAreas[faculty];
        var share = 1 / areas.length;
        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            areaToFractionalFacultyCount[area] = (areaToFractionalFacultyCount[area] || 0) + share;
        }
    }
    
    return areaToFractionalFacultyCount;
}

function computeICLRPoints(fromYear, toYear, baselineArea) {
    if (!perYearData) {
        throw new Error("Data not loaded");
    }
    
    var checkedConferences = getCheckedConferences();
    var conferenceToArea = perYearData.conference_to_area || {};
    var aggregatedPublicationCountByArea = {};
    var aggregatedCitationCountByArea = {};
    var aggregatedAgeAdjustedCitationCountByArea = {};
    var aggregatedFacultySetsByArea = {};
    
    if (perYearData.years_by_conference) {
        for (var year = fromYear; year <= toYear; year++) {
            var yearStr = String(year);
            var yearData = perYearData.years_by_conference[yearStr];
            if (!yearData) continue;
            
            for (var conf in yearData) {
                if (!checkedConferences[conf]) {
                    continue;
                }
                var data = yearData[conf];
                var area = conferenceToArea[conf] || data.area;
                if (!area) continue;
                
                aggregatedPublicationCountByArea[area] =
                    (aggregatedPublicationCountByArea[area] || 0) + data.publication_count;
                aggregatedCitationCountByArea[area] =
                    (aggregatedCitationCountByArea[area] || 0) + (data.citation_count || 0);
                aggregatedAgeAdjustedCitationCountByArea[area] =
                    (aggregatedAgeAdjustedCitationCountByArea[area] || 0) + (data.age_adjusted_citation_count || 0);
                if (!aggregatedFacultySetsByArea[area]) {
                    aggregatedFacultySetsByArea[area] = [];
                }
                var existingSet = new Set(aggregatedFacultySetsByArea[area]);
                for (var i = 0; i < data.faculty_names.length; i++) {
                    existingSet.add(data.faculty_names[i]);
                }
                aggregatedFacultySetsByArea[area] = Array.from(existingSet);
            }
        }
    } else {
        var checkedAreas = getCheckedAreas();
        for (var year = fromYear; year <= toYear; year++) {
            var yearStr = String(year);
            if (!perYearData.years[yearStr]) {
                continue;
            }
            
            var yearData = perYearData.years[yearStr];
            for (var area in yearData) {
                if (!checkedAreas[area]) {
                    continue;
                }
                var data = yearData[area];
                aggregatedPublicationCountByArea[area] =
                    (aggregatedPublicationCountByArea[area] || 0) + data.publication_count;
                aggregatedCitationCountByArea[area] =
                    (aggregatedCitationCountByArea[area] || 0) + (data.citation_count || 0);
                aggregatedAgeAdjustedCitationCountByArea[area] =
                    (aggregatedAgeAdjustedCitationCountByArea[area] || 0) + (data.age_adjusted_citation_count || 0);
                if (!aggregatedFacultySetsByArea[area]) {
                    aggregatedFacultySetsByArea[area] = [];
                }
                var existingSet = new Set(aggregatedFacultySetsByArea[area]);
                for (var i = 0; i < data.faculty_names.length; i++) {
                    existingSet.add(data.faculty_names[i]);
                }
                aggregatedFacultySetsByArea[area] = Array.from(existingSet);
            }
        }
    }
    
    if (Object.keys(aggregatedPublicationCountByArea).length === 0) {
        return [];
    }
    var areaToFractionalFacultyCount = computeFractionalFaculty(aggregatedFacultySetsByArea);
    var baselineFractionalFacultyCount = areaToFractionalFacultyCount[baselineArea];
    var baselinePublicationCount = aggregatedPublicationCountByArea[baselineArea];
    var baselineAgeAdjustedCitationCount = aggregatedAgeAdjustedCitationCountByArea[baselineArea] || 0;
    
    if (!baselineFractionalFacultyCount || !baselinePublicationCount || baselinePublicationCount === 0) {
        return [];
    }
    
    var baseline = baselineFractionalFacultyCount / baselinePublicationCount;
    var baselineAgeAdjPerPub = baselinePublicationCount > 0 && baselineAgeAdjustedCitationCount > 0
        ? baselineAgeAdjustedCitationCount / baselinePublicationCount
        : 0;
    var results = [];
    var areas = Object.keys(aggregatedPublicationCountByArea).sort();
    
    for (var i = 0; i < areas.length; i++) {
        var area = areas[i];
        var publicationCount = aggregatedPublicationCountByArea[area];
        var fractionalFacultyCount = areaToFractionalFacultyCount[area] || 0;
        var ageAdjustedCitationCount = aggregatedAgeAdjustedCitationCountByArea[area] || 0;
        
        if (publicationCount === 0) {
            continue;
        }
        
        var facultyPerPub = fractionalFacultyCount / publicationCount;
        var iclrPoints = facultyPerPub / baseline;
        var impactPoints = 0;
        if (baselineAgeAdjPerPub > 0 && publicationCount > 0) {
            var ageAdjPerPub = ageAdjustedCitationCount / publicationCount;
            impactPoints = ageAdjPerPub / baselineAgeAdjPerPub;
        }
        var combinedPoints = (iclrPoints > 0 && impactPoints > 0)
            ? Math.sqrt(iclrPoints * impactPoints)
            : 0;
        var parentArea = perYearData.area_to_parent[area];
        
        results.push({
            area: area,
            parent: parentArea,
            publication_count: publicationCount,
            citation_count: aggregatedCitationCountByArea[area] || 0,
            age_adjusted_citation_count: Math.round(ageAdjustedCitationCount * 100) / 100,
            faculty_count: Math.round(fractionalFacultyCount * 100) / 100,
            iclr_points: Math.round(iclrPoints * 100) / 100,
            impact_points: Math.round(impactPoints * 100) / 100,
            combined_points: Math.round(combinedPoints * 100) / 100
        });
    }
    
    return results;
}

function computeICLRPointsTrend(fromYear, toYear, baselineArea) {
    if (!perYearData) {
        throw new Error("Data not loaded");
    }
    
    var checkedConferences = getCheckedConferences();
    var conferenceToArea = perYearData.conference_to_area || {};
    var years = [];
    var areaToPointsByYear = {};
    var parentOrder = ["AI", "Systems", "Theory", "Interdisciplinary Areas"];

    for (var year = fromYear; year <= toYear; year++) {
        var yearStr = String(year);
        var areaToFaculty = {};
        var areaToPublicationCount = {};

        if (perYearData.years_by_conference && perYearData.years_by_conference[yearStr]) {
            var yearConfData = perYearData.years_by_conference[yearStr];
            for (var conf in yearConfData) {
                if (!checkedConferences[conf]) {
                    continue;
                }
                var data = yearConfData[conf];
                var area = conferenceToArea[conf] || data.area;
                if (!area) continue;
                
                if (!areaToFaculty[area]) {
                    areaToFaculty[area] = [];
                }
                var existingSet = new Set(areaToFaculty[area]);
                for (var i = 0; i < data.faculty_names.length; i++) {
                    existingSet.add(data.faculty_names[i]);
                }
                areaToFaculty[area] = Array.from(existingSet);
                areaToPublicationCount[area] = (areaToPublicationCount[area] || 0) + data.publication_count;
            }
        } else if (perYearData.years[yearStr]) {
            var checkedAreas = getCheckedAreas();
            var yearData = perYearData.years[yearStr];
            for (var area in yearData) {
                if (!checkedAreas[area]) {
                    continue;
                }
                var data = yearData[area];
                areaToFaculty[area] = data.faculty_names;
                areaToPublicationCount[area] = data.publication_count;
            }
        } else {
            continue;
        }

        var areaToFractionalFacultyCount = computeFractionalFaculty(areaToFaculty);
        var baselineFractionalFacultyCount = areaToFractionalFacultyCount[baselineArea];
        var baselinePublicationCount = areaToPublicationCount[baselineArea];

        if (!baselineFractionalFacultyCount || !baselinePublicationCount || baselinePublicationCount === 0) {
            continue;
        }

        var baseline = baselineFractionalFacultyCount / baselinePublicationCount;
        years.push(year);

        for (var area in areaToPublicationCount) {
            var pubCount = areaToPublicationCount[area];
            var fracFaculty = areaToFractionalFacultyCount[area] || 0;
            if (pubCount === 0) continue;

            var facultyPerPub = fracFaculty / pubCount;
            var iclrPoints = Math.round((facultyPerPub / baseline) * 100) / 100;

            if (!areaToPointsByYear[area]) areaToPointsByYear[area] = {};
            areaToPointsByYear[area][year] = iclrPoints;
        }
    }

    var areas = Object.keys(areaToPointsByYear).sort();
    var result = {
        years: years,
        areas: areas,
        areaToPointsByYear: areaToPointsByYear,
        baselineArea: baselineArea
    };
    return result;
}

function computeConferenceICLRPoints(fromYear, toYear, baselineConference) {
    if (!perYearData) {
        throw new Error("Data not loaded");
    }
    if (!perYearData.years_by_conference) {
        throw new Error("Conference-level data not available. Regenerate per_year_data.json.");
    }

    var checkedConferences = getCheckedConferences();
    var aggregatedPublicationCountByConf = {};
    var aggregatedCitationCountByConf = {};
    var aggregatedAgeAdjustedCitationCountByConf = {};
    var aggregatedFacultySetsByConf = {};
    var conferenceToArea = perYearData.conference_to_area || {};

    for (var year = fromYear; year <= toYear; year++) {
        var yearStr = String(year);
        var yearData = perYearData.years_by_conference[yearStr];
        if (!yearData) continue;

        for (var conf in yearData) {
            if (!checkedConferences[conf]) {
                continue;
            }
            var data = yearData[conf];
            aggregatedPublicationCountByConf[conf] =
                (aggregatedPublicationCountByConf[conf] || 0) + data.publication_count;
            aggregatedCitationCountByConf[conf] =
                (aggregatedCitationCountByConf[conf] || 0) + (data.citation_count || 0);
            aggregatedAgeAdjustedCitationCountByConf[conf] =
                (aggregatedAgeAdjustedCitationCountByConf[conf] || 0) + (data.age_adjusted_citation_count || 0);

            if (!aggregatedFacultySetsByConf[conf]) {
                aggregatedFacultySetsByConf[conf] = [];
            }
            var existingSet = new Set(aggregatedFacultySetsByConf[conf]);
            for (var i = 0; i < data.faculty_names.length; i++) {
                existingSet.add(data.faculty_names[i]);
            }
            aggregatedFacultySetsByConf[conf] = Array.from(existingSet);

            if (!conferenceToArea[conf] && data.area) {
                conferenceToArea[conf] = data.area;
            }
        }
    }

    if (Object.keys(aggregatedPublicationCountByConf).length === 0) {
        return [];
    }

    var confToFractionalFacultyCount = computeFractionalFaculty(aggregatedFacultySetsByConf);
    var baselineFractionalFacultyCount = confToFractionalFacultyCount[baselineConference];
    var baselinePublicationCount = aggregatedPublicationCountByConf[baselineConference];
    var baselineAgeAdjustedCitationCount = aggregatedAgeAdjustedCitationCountByConf[baselineConference] || 0;

    if (!baselineFractionalFacultyCount || !baselinePublicationCount || baselinePublicationCount === 0) {
        return [];
    }

    var baseline = baselineFractionalFacultyCount / baselinePublicationCount;
    var baselineAgeAdjPerPub = baselinePublicationCount > 0 && baselineAgeAdjustedCitationCount > 0
        ? baselineAgeAdjustedCitationCount / baselinePublicationCount
        : 0;
    var results = [];
    var conferences = Object.keys(aggregatedPublicationCountByConf).sort();

    for (var i = 0; i < conferences.length; i++) {
        var conf = conferences[i];
        var publicationCount = aggregatedPublicationCountByConf[conf];
        var fractionalFacultyCount = confToFractionalFacultyCount[conf] || 0;
        var ageAdjustedCitationCount = aggregatedAgeAdjustedCitationCountByConf[conf] || 0;
        if (publicationCount === 0) continue;

        var facultyPerPub = fractionalFacultyCount / publicationCount;
        var iclrPoints = facultyPerPub / baseline;
        var impactPoints = 0;
        if (baselineAgeAdjPerPub > 0 && publicationCount > 0) {
            var ageAdjPerPub = ageAdjustedCitationCount / publicationCount;
            impactPoints = ageAdjPerPub / baselineAgeAdjPerPub;
        }
        var combinedPoints = (iclrPoints > 0 && impactPoints > 0)
            ? Math.sqrt(iclrPoints * impactPoints)
            : 0;
        var area = conferenceToArea[conf];
        var parentArea = area ? perYearData.area_to_parent[area] : null;

        results.push({
            label: conf,
            area: area,
            parent: parentArea,
            publication_count: publicationCount,
            citation_count: aggregatedCitationCountByConf[conf] || 0,
            age_adjusted_citation_count: Math.round(ageAdjustedCitationCount * 100) / 100,
            faculty_count: Math.round(fractionalFacultyCount * 100) / 100,
            iclr_points: Math.round(iclrPoints * 100) / 100,
            impact_points: Math.round(impactPoints * 100) / 100,
            combined_points: Math.round(combinedPoints * 100) / 100
        });
    }

    return results;
}

function getICLRPointsData(fromYear, toYear, baselineArea) {
    return loadPerYearData()
        .then(function() {
            return computeICLRPoints(fromYear, toYear, baselineArea);
        });
}

function getICLRPointsTrendData(fromYear, toYear, baselineArea) {
    return loadPerYearData()
        .then(function() {
            return computeICLRPointsTrend(fromYear, toYear, baselineArea);
        });
}

function getConferencePointsData(fromYear, toYear, baselineConference) {
    var baseline = baselineConference || BASELINE_CONFERENCE;
    return loadPerYearData()
        .then(function() {
            return computeConferenceICLRPoints(fromYear, toYear, baseline);
        });
}

function updateChart(fromYear, toYear) {
    var conferenceView = isConferenceViewEnabled();
    var trendView = isTrendViewEnabled();
    var metricMode = getMetricMode();
    var baselineSelect = document.getElementById("baseline-dropbox");
    var baselineConferenceSelect = document.getElementById("baseline-conference-dropbox");
    var trendToggleLabel = document.getElementById("trend-toggle-label");

    if (baselineSelect) {
        baselineSelect.disabled = conferenceView;
        baselineSelect.style.display = conferenceView ? "none" : "";
        baselineSelect.title = conferenceView ? "" : "";
    }
    if (baselineConferenceSelect) {
        baselineConferenceSelect.style.display = conferenceView ? "" : "none";
        baselineConferenceSelect.disabled = !conferenceView;
    }
    if (trendToggleLabel) {
        trendToggleLabel.style.display = conferenceView ? "none" : "inline-flex";
        if (conferenceView && trendView) {
            document.getElementById("trend-view-toggle").checked = false;
        }
    }

    var dataPromise;
    var baselineArea = DEFAULT_BASELINE_AREA;
    var baselineConference = BASELINE_CONFERENCE;
    var useTrendChart = !conferenceView && trendView;

    if (conferenceView) {
        baselineConference = (baselineConferenceSelect && baselineConferenceSelect.value) || BASELINE_CONFERENCE;
        dataPromise = getConferencePointsData(fromYear, toYear, baselineConference);
    } else if (useTrendChart) {
        baselineArea = (baselineSelect && baselineSelect.value) || DEFAULT_BASELINE_AREA;
        dataPromise = getICLRPointsTrendData(fromYear, toYear, baselineArea);
    } else {
        baselineArea = (baselineSelect && baselineSelect.value) || DEFAULT_BASELINE_AREA;
        dataPromise = getICLRPointsData(fromYear, toYear, baselineArea);
    }

    if (useTrendChart) {
        dataPromise.then(function(trendData) {
            renderTrendChart(trendData);
        }).catch(function(error) {});
        return;
    }

    dataPromise
        .then(function(data){
            if (!data || data.length === 0) {
                var chartEl = document.getElementById("chart");
                if (chartEl) {
                    Plotly.purge(chartEl);
                    chartEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #666; font-size: 1.1em;">No data available. Please select at least one conference containing the baseline.</div>';
                }
                return;
            }

            var parentOrder= ["AI", "Systems", "Theory", "Interdisciplinary Areas"];
            var rows = [];
            if (conferenceView) {
                rows = data;
            } else {
                rows = data.map(function(r) {
                    return {
                        label: r.area,
                        area: r.area,
                        parent: r.parent,
                        publication_count: r.publication_count,
                        faculty_count: r.faculty_count,
                        citation_count: r.citation_count || 0,
                        age_adjusted_citation_count: r.age_adjusted_citation_count || 0,
                        iclr_points: r.iclr_points,
                        impact_points: r.impact_points || 0,
                        combined_points: r.combined_points || 0
                    };
                });
            }

            rows.sort(function(a,b) {
                var pa = parentOrder.indexOf(a.parent);
                var pb = parentOrder.indexOf(b.parent);
                if (pa !== pb) return pa - pb;
                return (a.label || "").localeCompare(b.label || "");
            });

            var areas = [];
            var values = [];
            var parents = [];
            var customdata = [];
            for(var i = rows.length - 1; i >= 0; i--) {
                var row = rows[i];
                areas.push(row.label);
                var value = row.iclr_points;
                if (metricMode === "impact") value = row.impact_points || 0;
                if (metricMode === "combined") value = row.combined_points || 0;
                values.push(value);
                parents.push(row.parent);
                customdata.push([
                    row.faculty_count,
                    row.publication_count,
                    row.area,
                    row.citation_count || 0,
                    row.age_adjusted_citation_count || 0,
                    row.iclr_points || 0,
                    row.impact_points || 0,
                    row.combined_points || 0
                ]);
            };
    
    var colorMap = {
        "AI": { fill: "rgba(31, 119, 180, 0.4)", line: "rgba(31, 119, 180, 0.9)" },
        "Systems": { fill: "rgba(255, 127, 14, 0.4)", line: "rgba(255, 127, 14, 0.9)" },
        "Theory": { fill: "rgba(44, 160, 44, 0.4)", line: "rgba(44, 160, 44, 0.9)" },
        "Interdisciplinary Areas": { fill: "rgba(148, 103, 189, 0.4)", line: "rgba(148, 103, 189, 0.9)" }
    };
    var defaultColor = { fill: "rgba(150, 150, 150, 0.4)", line: "rgba(150, 150, 150, 0.9)" };
    var baselineFill = "rgba(240, 196, 25, 0.85)";
    var baselineLine = "rgba(204, 160, 0, 1)";
    var barColors = [];
    var lineColors = [];
    for (var cIdx = 0; cIdx < parents.length; cIdx++) {
        var parent = parents[cIdx];
        var baseColors = colorMap[parent] || defaultColor;
        barColors[cIdx] = baseColors.fill;
        lineColors[cIdx] = baseColors.line;
        var label = areas[cIdx];
        var isBaselineBar = conferenceView ? (label === baselineConference) : (label === baselineArea);
        if (isBaselineBar) {
            barColors[cIdx] = baselineFill;
            lineColors[cIdx] = baselineLine;
        }
    }

    var hovertemplate;
    if (conferenceView) {
        var metricLabel = getMetricLabel(metricMode);
        hovertemplate = '<b>%{y}</b><br>' +
            'Area: %{customdata[2]}<br>' +
            'Faculty: %{customdata[0]}<br>' +
            'Publications: %{customdata[1]}<br>' +
            'Citations: %{customdata[3]}<br>' +
            'Age-adjusted citations: %{customdata[4]:.2f}<br>' +
            'Effort points: %{customdata[5]:.2f}<br>' +
            'Impact points: %{customdata[6]:.2f}<br>' +
            'Combined points: %{customdata[7]:.2f}<br>' +
            metricLabel + ': %{x:.2f}<br>' +
            'Baseline: ' + baselineConference + '<br>' +
            '<extra></extra>';
    } else {
        var metricLabel = getMetricLabel(metricMode);
        hovertemplate = '<b>%{y}</b><br>' +
            'Faculty: %{customdata[0]}<br>' +
            'Publications: %{customdata[1]}<br>' +
            'Citations: %{customdata[3]}<br>' +
            'Age-adjusted citations: %{customdata[4]:.2f}<br>' +
            'Effort points: %{customdata[5]:.2f}<br>' +
            'Impact points: %{customdata[6]:.2f}<br>' +
            'Combined points: %{customdata[7]:.2f}<br>' +
            metricLabel + ': %{x:.2f}<br>' +
            'Baseline: ' + baselineArea + '<br>' +
            '<extra></extra>';
    }

    var textPosition = 'inside';
    var textFontSize = conferenceView ? 14 : 16;

    var trace = {
        type: "bar",
        x: values,
        y: areas,
        orientation: "h",
        marker: {
            color: barColors,
            line: { 
                color: lineColors, 
                width: 0.8
            },
            opacity: 0.95
        },
        text: values.map(function(v) { return v.toFixed(2); }),
        textposition: textPosition,
        insidetextanchor: 'start',
        constraintext: 'none',
        cliponaxis: false,
        textfont: { 
            color: '#2c3e50', 
            size: textFontSize,
            family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        },
        customdata: customdata,
        hovertemplate: hovertemplate,
        hoverlabel: {
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            bordercolor: 'rgba(0, 0, 0, 0.2)',
            font: {
                family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                size: 12,
                color: '#2c3e50'
            },
            namelength: -1
        }
    };

    var rowCount = areas.length || 1;
    var perRowPx = conferenceView ? 24 : 24;
    var minHeight = 760;
    var paddingPx = 220;
    var dynamicHeight = Math.max(minHeight, Math.round(rowCount * perRowPx + paddingPx));
    var xMax = values.length ? Math.max(2, Math.max.apply(null, values) * 1.08) : 7;

    var layout = {
        width: 960,
        height: dynamicHeight,
        margin: { l: 230, r: 120, t: 50, b: 20 },
        bargap: conferenceView ? 0.35 : 0.2,
        title: {
            text: (conferenceView ? baselineConference : baselineArea) + ' ' + getMetricLabel(metricMode) + ' Points',
            font: {
                size: 18,
                color: '#2c3e50',
                family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            },
            x: 0.5,
            xanchor: 'center',
            y: 0.98,
            yanchor: 'top'
        },

        xaxis: {
          range: [0, xMax],
          autorange: false,
          fixedrange: true,
          dtick: 1,
          showgrid: true,
          gridcolor: "rgba(0,0,0,0.06)",
          gridwidth: 1,
          zeroline: false,
          showline: true,
          mirror: true,
          linecolor: 'rgba(0,0,0,0.3)',
          linewidth: 1,
          tickfont: {
              size: 11,
              color: '#7f8c8d',
              family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }
        },
      
        yaxis: {
          fixedrange: true,
          tickfont: { 
              size: 15,
              color: '#2c3e50',
              family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          },
          automargin: true,
          showgrid: false,
          showline: true,
          mirror: true,
          linecolor: 'rgba(0,0,0,0.3)',
          linewidth: 1
        },
      
        showlegend: false,
        paper_bgcolor: "rgba(255, 255, 255, 0)",
        plot_bgcolor: "rgba(250, 250, 250, 0.3)",
        hovermode: 'closest',
        font: {
            family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }
      };
      

    var config = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        doubleClick: 'reset',
        showTips: false
    };

    var chartEl = document.getElementById("chart");
    if (chartEl && chartEl.data) {
        var prevLen = (chartEl.data[0] && chartEl.data[0].y && chartEl.data[0].y.length) ? chartEl.data[0].y.length : 0;
        var nextLen = areas.length;
        if (prevLen !== nextLen) {
            Plotly.react("chart", [trace], layout, config);
        } else {
            Plotly.animate("chart",
                { data: [trace], layout: layout },
                { transition: { duration: 500, easing: 'cubic-in-out' }, frame: { duration: 500 } }
            );
        }
    } else {
        Plotly.newPlot("chart", [trace], layout, config);
    }
        })
        .catch(function(error) {
        });
}

function renderTrendChart(trendData) {
    var years = trendData.years;
    var areaToPointsByYear = trendData.areaToPointsByYear || {};
    var baselineArea = trendData.baselineArea;
    var parentOrder = ["AI", "Systems", "Theory", "Interdisciplinary Areas"];
    var areaToParent = perYearData && perYearData.area_to_parent ? perYearData.area_to_parent : {};

    if (!years || years.length === 0) {
        var chartEl = document.getElementById("chart");
        if (chartEl) {
            Plotly.purge(chartEl);
            chartEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #666; font-size: 1.1em;">No data available. Please select at least one conference containing the baseline.</div>';
        }
        return;
    }

    var colorMap = {
        "AI": "rgb(31, 119, 180)",
        "Systems": "rgb(255, 127, 14)",
        "Theory": "rgb(44, 160, 44)",
        "Interdisciplinary Areas": "rgb(148, 103, 189)"
    };

    var areas = Object.keys(areaToPointsByYear);
    areas.sort(function (a, b) {
        var pa = areaToParent[a] || "";
        var pb = areaToParent[b] || "";
        var ia = parentOrder.indexOf(pa);
        var ib = parentOrder.indexOf(pb);
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
    });

    var traces = [];
    for (var i = 0; i < areas.length; i++) {
        var area = areas[i];
        var ptsByYear = areaToPointsByYear[area];
        var x = [];
        var y = [];
        for (var j = 0; j < years.length; j++) {
            var yr = years[j];
            if (ptsByYear[yr] !== undefined) {
                x.push(yr);
                y.push(Math.round(ptsByYear[yr] * 100) / 100);
            }
        }
        if (x.length === 0) continue;

        var parent = areaToParent[area] || "";
        var color = colorMap[parent] || "rgb(150, 150, 150)";

        traces.push({
            type: "scatter",
            mode: "lines+markers",
            name: area,
            legendgroup: parent,
            x: x,
            y: y,
            line: { color: color, width: 2.5 },
            marker: { size: 8 },
            hovertemplate: "<b>%{fullData.name}</b><br>Year: %{x}<br>Points: %{y:.2f}<br>Baseline: " + baselineArea + "<extra></extra>",
            hoverlabel: {
                bgcolor: "rgba(255, 255, 255, 0.95)",
                bordercolor: "rgba(0, 0, 0, 0.2)",
                font: { family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", size: 12, color: "#2c3e50" },
                namelength: -1
            }
        });
    }

    if (traces.length === 0) {
        var chartEl = document.getElementById("chart");
        if (chartEl) {
            Plotly.purge(chartEl);
            chartEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #666; font-size: 1.1em;">No data available. Select at least one conference containing the baseline.</div>';
        }
        return;
    }

    var yMax = 0;
    for (var t = 0; t < traces.length; t++) {
        for (var k = 0; k < traces[t].y.length; k++) {
            if (traces[t].y[k] > yMax) yMax = traces[t].y[k];
        }
    }
    yMax = Math.max(2, (yMax || 1) * 1.08);

    var layout = {
        width: 960,
        height: 600,
        margin: { l: 80, r: 140, t: 60, b: 60 },
        title: {
            text: baselineArea + " Points (Trend)",
            font: { size: 18, color: "#2c3e50", family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
            x: 0.5,
            xanchor: "center",
            y: 0.98,
            yanchor: "top"
        },
        xaxis: {
            title: "Year",
            tickmode: "linear",
            dtick: years.length > 15 ? 2 : 1,
            showgrid: true,
            gridcolor: "rgba(0,0,0,0.06)",
            zeroline: false,
            showline: true,
            mirror: true,
            linecolor: "rgba(0,0,0,0.3)",
            tickfont: { size: 11, color: "#7f8c8d", family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }
        },
        yaxis: {
            title: "ICLR Points",
            range: [0, yMax],
            showgrid: true,
            gridcolor: "rgba(0,0,0,0.06)",
            zeroline: true,
            zerolinecolor: "rgba(0,0,0,0.2)",
            showline: true,
            mirror: true,
            linecolor: "rgba(0,0,0,0.3)",
            tickfont: { size: 11, color: "#7f8c8d", family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }
        },
        showlegend: true,
        legend: {
            x: 1.02,
            y: 1,
            xanchor: "left",
            yanchor: "top",
            font: { size: traces.length > 15 ? 9 : 11, family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
            tracegroupgap: traces.length > 15 ? 2 : 5,
            bgcolor: "rgba(255,255,255,0.8)",
            bordercolor: "rgba(0,0,0,0.1)"
        },
        paper_bgcolor: "rgba(255, 255, 255, 0)",
        plot_bgcolor: "rgba(250, 250, 250, 0.3)",
        hovermode: "closest",
        font: { family: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }
    };

    var config = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        doubleClick: "reset",
        showTips: false
    };

    Plotly.react("chart", traces, layout, config);
}

function getYearsFromInput() {
    var fromYear = parseInt(document.getElementById("from-year").value);
    var toYear = parseInt(document.getElementById("to-year").value);
    var currentYear = new Date().getFullYear();
    if (isNaN(fromYear)) fromYear = currentYear - 10;
    if (isNaN(toYear)) toYear = currentYear;
    return { from: fromYear, to: toYear};
}

function setup(){
    populateYearDropdowns();
    setupFilterCheckboxes();
    loadPerYearData()
        .then(function(data) {
            if (data.available_areas && data.available_areas.length > 0) {
                populateBaselineDropdown(data.available_areas);
            }
            if (data.years_by_conference) {
                var conferences = getAvailableConferences();
                if (conferences.length > 0) {
                    populateBaselineConferenceDropdown(conferences);
                }
            }
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        })
        .catch(function(error) {});

    var from = document.getElementById("from-year");
    var to = document.getElementById("to-year");
    from.addEventListener("change", function(){
        var yrs = getYearsFromInput();
        updateChart(yrs.from, yrs.to);
    });
    to.addEventListener("change", function(){
        var yrs = getYearsFromInput();
        updateChart(yrs.from, yrs.to);
    });

    var baselineSelect = document.getElementById("baseline-dropbox");
    baselineSelect.addEventListener("change", function(){
        var yrs = getYearsFromInput();
        updateChart(yrs.from, yrs.to);
    });

    var baselineConferenceSelect = document.getElementById("baseline-conference-dropbox");
    if (baselineConferenceSelect) {
        baselineConferenceSelect.addEventListener("change", function(){
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }

    var conferenceToggle = document.getElementById("conference-view-toggle");
    if (conferenceToggle) {
        conferenceToggle.addEventListener("change", function(){
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }

    var trendToggle = document.getElementById("trend-view-toggle");
    if (trendToggle) {
        trendToggle.addEventListener("change", function(){
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }

    var metricModeSelect = document.getElementById("metric-mode");
    if (metricModeSelect) {
        metricModeSelect.addEventListener("change", function(){
            var yrs = getYearsFromInput();
            updateChart(yrs.from, yrs.to);
        });
    }

}

setup();

