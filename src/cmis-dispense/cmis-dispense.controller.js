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
     * @name cmis-dispense.controller:CmisDispenseController
     *
     * @description
     * Controller that show dispense view screen.
     */
    angular
        .module('cmis-dispense')
        .controller('CmisDispenseController', CmisDispenseController);

    CmisDispenseController.$inject = [
        'CmisRequestService',
        '$stateParams',
        'user',
        'facility',
        'visit',
        'stateTrackerService',
        'orderableGroupService',
        'summaries',
        '$filter',
        '$q',
        'alertService'
    ];

    function CmisDispenseController(
        CmisRequestService,
        $stateParams,
        user,
        facility,
        visit,
        stateTrackerService,
        orderableGroupService,
        summaries,
        $filter,
        $q,
        alertService
    ) {
        var vm = this;
        vm.$onInit = onInit;
        this.login = CmisRequestService.oauth2AuthorizationCall;
        this.isAuthorized = CmisRequestService.isUserAuthorized;

        vm.goToPreviousState = stateTrackerService.goToPreviousState;
        vm.getOrderablesGroups = getOrderablesGroups;
        vm.visitId = $stateParams.visitId;
        vm.user = user;
        vm.facility = facility;
        vm.programs = vm.facility.supportedPrograms;
        vm.program = vm.programs[0];
        vm.visit = visit.data;
        vm.getSoH = getSoH;
        vm.summaries = summaries;
        vm.save = save;

        // vm.orderableGroups = orderableGroups;
        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name $onInit
         *
         * @description
         * Initialization method of the CmisDispenseController.
         */
        function onInit() {
            CmisRequestService.saveOath2Token();
            vm.orderableGroups = getOrderablesGroups();
            vm.date = Date();
            calculateMedications();
        }

        // function getOrderablesGroups() {
        //     vm.programs.forEach(function(program) {
        //         existingStockOrderableGroupsFactory.getGroups($stateParams, program, facility)
        //             .then(function(response) {
        //                 vm.orderableGroups.push(response);
        //             });
        //         })
        //     // .getGroupsWithNotZeroSoh($stateParams, program, facility);
        // }

        function getOrderablesGroups() {
            orderableGroupService
                .findAvailableProductsAndCreateOrderableGroups(
                    vm.program.id,
                    vm.facility.id,
                    true
                )
                .then(function(response) {
                    vm.orderableGroups = response;
                });
        }

        function calculateMedications() {
            vm.visit.prescriptions.forEach(function(prescription) {
                prescription.medications.forEach(function(medication) {
                    medication.soh = getSoH('C100');
                    medication.balance = calculateInterval(medication);
                });
            });
        }

        function getSoH(code) {
            var orderable = $filter('filter')(vm.summaries, {
                orderable: {
                    productCode: code
                }
            });
            return orderable[0][0].stockOnHand;
        }

        function calculateInterval(medication) {
            return medication.soh - medication.dose * medication.duration;
        }

        function save() {
            var selectedMedications = [];
            angular.forEach(vm.visit.prescriptions, function(prescription) {
                angular.forEach(
                    prescription.medications,
                    function(medication) {
                        if (medication.$selected) {
                            selectedMedications.push(medication);
                        }
                    }
                );
            });

            var dataToSend = {};

            dataToSend.data = selectedMedications;
            $q.resolve(
                CmisRequestService.putRequest(
                    'https://eswantest.free.beeceptor.com/prescription/client/dispense',
                    dataToSend
                )
            ).then(function(response) {
                alertService.success('Send successful', response);
            });
        }
    }
})();
