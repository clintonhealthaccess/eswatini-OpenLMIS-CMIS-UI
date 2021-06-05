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
        '$state', 'facility', 'user', 'clients', '$filter'
    ];

    function CmisViewController($state, facility, user, clients, $filter) {

        var vm = this;

        vm.$onInit = onInit;
        vm.doDispense = doDispense;
        vm.filterList = filterList;
        vm.clients = clients.data;
        vm.cachedClients = clients.data;

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
            vm.clients = vm.cachedClients;
            if (vm.patientName) {
                vm.clients = $filter('filter')(vm.clients, {
                    first_name: vm.patientName
                });
            } else if (vm.patientLastName) {
                vm.clients = $filter('filter')(vm.clients, {
                    last_name: vm.patientLastName
                });
            } else if (vm.patientId) {
                vm.clients = $filter('filter')(vm.clients, {
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
    }
}());
