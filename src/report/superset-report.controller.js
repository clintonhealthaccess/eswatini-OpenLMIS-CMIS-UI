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
     * @ngdoc controller
     * @name report.controller:SupersetReportController
     *
     * @description
     * Controller for superset report view.
     */
    angular
        .module('report')
        .controller('SupersetReportController', SupersetReportController);

    SupersetReportController.inject = ['reportCode', 'reportUrl', '$q', '$http', 'loadingModalService', '$sce'];

    function SupersetReportController(reportCode, reportUrl, $q, $http, loadingModalService, $sce) {
        var vm = this;
        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf report.controller:SupersetReportController
         * @name reportCode
         * @type {string}
         *
         * @description
         * The superset report code.
         */
        vm.reportCode = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:SupersetReportController
         * @name reportUrl
         * @type {string}
         *
         * @description
         * The superset report URL.
         */
        vm.reportUrl = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:SupersetReportController
         * @name authUrl
         * @type {string}
         *
         * @description
         * The superset authorization URL.
         */
        vm.authUrl = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:SupersetReportController
         * @name isReady
         * @type {boolean}
         *
         * @description
         * Indicates if the controller is ready for displaying the Superset iframe.
         */
        vm.isReady = false;

        vm.reportHTML = '';

        function onInit() {
            loadingModalService.open();
            vm.reportCode = reportCode;
            vm.reportUrl = reportUrl;

            vm.isReady = true;

            $q.resolve(doGet($sce.getTrustedUrl(vm.reportUrl)))
                .then(function(response) {
                    vm.reportHTML = response;
                    loadingModalService.close();
                });

        }

        function doGet(url) {
            var dataPromise = $http
                .get(url)
                .then(function(response) {
                    if (
                        response.data.message ===
                        'Wrong parameters or prescription expired'
                    ) {
                        return {
                            data: {}
                        };
                    }
                    return response.data;
                })
                .catch(function() {
                    return $q.reject();
                });
            return dataPromise;
        }

    }

})();
