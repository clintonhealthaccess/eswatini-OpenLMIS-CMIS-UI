/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

(function() {

    'use strict';

    /**
     * @ngdoc object
     * @name report.supersetReports
     *
     * @description
     * This is constant defining available superset reports.
     */
    angular
        .module('report')
        .factory('supersetReports', supersetReports);

    supersetReports.$inject = ['SUPERSET_URL'];

    function supersetReports(SUPERSET_URL) {
        var reports = {};
        if (SUPERSET_URL.substr(0, 2) !== '${') {
            reports = {
                PRODUCT_STATUS_BY_FACILITY: createReport('productStatusByFacility',
                    SUPERSET_URL + '/superset/dashboard/productStatusByFacility/',
                    ''),
                PRODUCT_STOCKOUT: createReport('productStockout',
                    SUPERSET_URL + '/superset/dashboard/productStockout/',
                    ''),
                INVENTORY_REPORT_BY_FACILITY: createReport('inventoryReportByFacility',
                    SUPERSET_URL + '/superset/dashboard/inventoryReportByFacility/',
                    ''),
                ORDER_FILL_RATE: createReport('OrderFillRate',
                    SUPERSET_URL + '/superset/dashboard/orderFillRate/',
                    ''),
                ADJUSTMENT_SUMMARY: createReport('AdjustmentSummary',
                    SUPERSET_URL + '/superset/dashboard/adjustmentSummary/',
                    ''),
                DISPENSED_PRODUCTS_SUMMARY: createReport('DispensedProductsSummary',
                    SUPERSET_URL + '/superset/dashboard/dispensedProductsSummary/',
                    ''),
                REPORTING_RATE: createReport('ReportingRate',
                    SUPERSET_URL + '/superset/dashboard/reportingRate/',
                    ''),
                MEDICATION_COSTS: createReport('MedicationCosts',
                    SUPERSET_URL + '/superset/dashboard/medicationCosts/',
                    ''),
                NON_REPORTING_FACILITIES: createReport('NonReportingFacilities',
                    SUPERSET_URL + '/superset/dashboard/nonReportingFacilities/',
                    ''),
                ORDERED_QUANTITIES: createReport('OrderedQuantities',
                    SUPERSET_URL + '/superset/dashboard/orderedQuantities/',
                    ''),
                CONSUMPTION_REPORT: createReport('ConsumptionReport',
                    SUPERSET_URL + '/superset/dashboard/consumptionReport/',
                    ''),
                OUTSTANDING_ORDERS: createReport('OutstandingOrders',
                    SUPERSET_URL + '/superset/dashboard/outstandingOrders/',
                    ''),
                EXCEPTION_REPORT: createReport('ExceptionReport',
                    SUPERSET_URL + '/superset/dashboard/exceptionReport/',
                    '')
            };
        }
        return {
            getReports: getReports,
            addReporingPages: addReporingPages
        };

        function addReporingPages($stateProvider) {
            if (angular.equals(reports, {})) {
                // nothing to do here
                return;
            }

            $stateProvider.state('openlmis.reports.list.superset', {
                abstract: true,
                url: '/superset',
                views: {
                    // we need the main page to flex to the window size
                    '@': {
                        templateUrl: 'openlmis-main-state/flex-page.html'
                    }
                }
            });

            Object.values(reports).forEach(function(report) {
                addReporingPage($stateProvider, report);
            });
        }

        function addReporingPage($stateProvider, report) {
            $stateProvider.state('openlmis.reports.list.superset.' + report.code, {
                url: '/' + report.code,
                label: 'report.superset.' + report.code,
                controller: 'SupersetReportController',
                templateUrl: 'report/superset-report.html',
                controllerAs: 'vm',
                resolve: {
                    reportUrl: function($sce) {
                        return $sce.trustAsResourceUrl(report.url);
                    },
                    reportCode: function() {
                        return report.code;
                    },
                    authorizationInSuperset: authorizeInSuperset
                }
            });
        }

        function getReports() {
            return reports;
        }

        function createReport(code, url, right) {
            return {
                code: code,
                url: url + '?standalone=true',
                right: right
            };
        }

        function authorizeInSuperset(loadingModalService, openlmisModalService, $q, $state, MODAL_CANCELLED) {
            loadingModalService.close();
            var dialog = openlmisModalService.createDialog({
                backdrop: 'static',
                keyboard: false,
                controller: 'SupersetOAuthLoginController',
                controllerAs: 'vm',
                templateUrl: 'report/superset-oauth-login.html',
                show: true
            });
            return dialog.promise
                .catch(function(reason) {
                    if (reason === MODAL_CANCELLED) {
                        $state.go('openlmis.reports.list');
                        return $q.resolve();
                    }
                    return $q.reject();
                });
        }
    }

})();
