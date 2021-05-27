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
     * @name cmis-view.controller:CmisViewController
     *
     * @description
     * Controller that show CMIS integration view screen.
     */
    angular
        .module('cmis-view')
        .controller('CmisViewController', CmisViewController);

    CmisViewController.$inject = [
        '$state', 'CmisRequestService'
    ];

    function CmisViewController($state, CmisRequestService) {

        var vm = this;

        vm.$onInit = onInit;
        vm.createPrescription = createPrescription;
        vm.prescriptions = undefined;
        vm.getPrescriptions = getPrescriptions;

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the CmisViewController.
         */
        function onInit() {
            vm.prescriptions = getPrescriptions();
        }

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name createPrescription
         *
         * @description
         * Creating new prescriptions
         *
         */
        function createPrescription() {

            $state.go('openlmis.cmis.prescription');
        }

        /**
         * @ngdoc method
         * @methodOf cmis-view.controller:CmisViewController
         * @name createPrescription
         *
         * @description
         * Creating new prescriptions
         *
         */
        function getPrescriptions() {
            var data = CmisRequestService.getRequest('http://cmis-dashboard.feisystems.com:8080'
                + '/PrescriptionService.svc/prescription/client/b2ba810e-9099-4ac4-bd2c-d3a86eb06439');
            vm.prescriptions = JSON.parse(data);
            console.log(vm.prescriptions);
        }

    }
}());
