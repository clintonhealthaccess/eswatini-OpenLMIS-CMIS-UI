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
/* eslint-disable camelcase */
(function() {

    'use strict';

    /**
     * @ngdoc controller
     * @name cmis-view.controller:CmisViewController
     *
     * @description
     * Controller that show CMIS integration view screen.
     */
    angular
        .module('cmis-view')
        .controller('CmisViewController', CmisViewController);

    CmisViewController.$inject = [
        '$state', 'facility', 'user', 'CmisRequestService', '$filter'
    ];

    function CmisViewController($state, facility, user, CmisRequestService, $filter) {

        var vm = this;

        vm.$onInit = onInit;
        vm.doDispense = doDispense;
        vm.getVisits = getVisits;
        vm.filterList = filterList;

        /**
         * @ngdoc property
         * @propertyOf cmis-view.controller:CmisViewController
         * @name user
         * @type {Object}
         *
         * @description
         * User object to be created/updated.
         */
        vm.user = undefined;

        /**
         * @ngdoc property
         * @propertyOf cmis-view.controller:CmisViewController
         * @name facility
         * @type {Object}
         *
         * @description
         * Holds user's home facility.
         */
        vm.facility = undefined;

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the CmisViewController.
         */
        function onInit() {
            vm.user = user;
            vm.facility = facility;
            vm.visits = getVisits();
        }

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name filter
         *
         * @description
         * Filter search
         *
         */
        function filterList() {
            vm.visits = vm.cachedVisits;
            if (vm.patientName) {
                vm.visits = $filter('filter')(vm.visits, {
                    first_name: vm.patientName
                });
            } else if (vm.patientLastName) {
                vm.visits = $filter('filter')(vm.visits, {
                    last_name: vm.patientLastName
                });
            } else if (vm.patientId) {
                vm.visits = $filter('filter')(vm.visits, {
                    patient_id: vm.patientId
                });
            }
        }

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name createPrescription
         *
         * @description
         * Creating new dispense
         *
         */
        function doDispense(visitId) {

            $state.go('openlmis.cmis.dispense', {
                visitId: visitId
            });
        }

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name getVisits
         *
         * @description
         * Get list of visits
         *
         */
        function getVisits() {
            vm.facility.code;
            var promise = CmisRequestService.getRequest('http://cmis-dashboard.feisystems.com:8080'
            + '/PrescriptionService.svc/prescription/clients/H002');

            promise.then(
                function(result) {
                    vm.visits = result.data;
                    vm.cachedVisits = result.data;
                }
            );
        }
    }
}());
