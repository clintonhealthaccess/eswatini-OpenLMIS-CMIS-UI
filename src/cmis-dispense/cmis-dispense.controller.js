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
        'summaries',
        '$filter',
        '$q',
        'alertService',
        'INTERVAL'
    ];

    function CmisDispenseController(
        CmisRequestService,
        $stateParams,
        user,
        facility,
        visit,
        stateTrackerService,
        summaries,
        $filter,
        $q,
        alertService,
        INTERVAL
    ) {
        var vm = this;
        vm.$onInit = onInit;
        this.login = CmisRequestService.oauth2AuthorizationCall;
        this.isAuthorized = CmisRequestService.isUserAuthorized;

        vm.goToPreviousState = stateTrackerService.goToPreviousState;
        vm.visitId = $stateParams.visitId;
        vm.user = user;
        vm.facility = facility;
        vm.programs = vm.facility.supportedPrograms;
        vm.program = vm.programs[0];
        vm.visit = visit.data;
        vm.summaries = summaries;
        vm.substituteTab = [];

        vm.date = '';
        vm.reason = '';
        vm.notes = '';

        vm.addSubstitute = addSubstitute;
        vm.save = save;
        vm.getSoH = getSoH;
        vm.substituteSelected = substituteSelected;

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
            vm.date = $filter('isoDate')(new Date());
            calculateMedications();
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
            return medication.soh - medication.dose * medication.duration * INTERVAL.type[medication.interval];
        }

        function addSubstitute(substitute) {
            if (substitute.$selected === true) {
                vm.substituteTab.push(substitute);
            } else {
                substitute.dispenseQuantity = 0;
                deleteSubstituteFromMedicaments(substitute, vm.visit.prescriptions);
                deleteSubstitute(substitute);
            }
        }

        function deleteSubstitute(substitute) {
            for (var i = 0; i <= vm.substituteTab.length; i++) {
                if (getProductName(substitute) === getProductName(vm.substituteTab[0])) {
                    vm.substituteTab.splice(i, 1);
                    break;
                }
            }
        }

        function substituteSelected(substitute) {
            //place for remove substitute from list when selected
            console.log(substitute);
        }

        function deleteSubstituteFromMedicaments(substitute, prescriptions) {
            angular.forEach(prescriptions, function(prescription) {
                angular.forEach(prescription.medications, function(medication) {
                    if (medication.substitute.orderable.id === substitute.orderable.id) {
                        medication.substitute = null;
                    }
                });
            });
        }

        function getProductName(item) {
            return item.orderable.fullProductName;
        }

        function save() {
            var selectedMedications = [];
            var substitutesTab = [];
            angular.forEach(vm.visit.prescriptions, function(prescription) {
                angular.forEach(
                    prescription.medications,
                    function(medication) {
                        var medicationJson = {};
                        if (medication.$selected) {
                            medicationJson = CmisRequestService.cmisMedicationBilder(
                                medication.medication_id,
                                medication.balance,
                                vm.date,
                                vm.reason,
                                vm.notes
                            );
                        } else {
                            medicationJson = CmisRequestService.cmisMedicationBilder(
                                medication.medication_id,
                                medication.substitute.dispenseQuantity,
                                vm.date,
                                vm.reason,
                                vm.notes
                            );
                            substitutesTab.push(medication.substitute);
                        }
                        selectedMedications.push(medicationJson);
                    }
                );
            });

            var dataToSend = {};

            dataToSend.data = selectedMedications;
            $q.resolve(
                CmisRequestService.putRequest(
                    '/prescription/client/dispense',
                    dataToSend
                )
            ).then(function(cmisResponse) {
                console.log(cmisResponse);
                console.log(substitutesTab);
                return cmisResponse;

            })
                .then(function(olmisResponse) {
                    alertService.success('Send successful', olmisResponse);
                });
        }
    }
})();
