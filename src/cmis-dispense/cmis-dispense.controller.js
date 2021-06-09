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
        this.medicationsTmp = [];
        this.substitutesTmp = [];
        // this.substitutesMap = new Map();

        vm.goToPreviousState = stateTrackerService.goToPreviousState;
        vm.visitId = $stateParams.visitId;
        vm.user = user;
        vm.facility = facility;
        vm.programs = vm.facility.supportedPrograms;
        vm.program = vm.programs[0];
        vm.visit = visit.data;
        vm.getSoH = getSoH;
        vm.summaries = summaries;
        vm.save = save;
        vm.disableMedications = false;
        vm.disableSubstitutes = true;
        vm.lockMedications = lockMedications;

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

        function lockMedications(type, id) {
            this.disableMedications = !this.disableMedications;
            this.disableSubstitutes = !this.disableSubstitutes;
            var medLength = this.medicationsTmp.length;
            var subLength = this.substitutesTmp.length;
            if (type === 'med') {
                if (medLength > subLength) {
                    this.substitutesMap = [];
                    this.medicationsTmp = [];
                    this.substitutesMap.clear();
                } else if (medLength < subLength) {
                    this.substitutesTmp.pop();
                } else {
                    this.medicationsTmp.push(id);
                }

            }
            if (type === 'sub') {
                if (medLength > subLength) {
                    this.substitutesTmp.push(id);
                } else if (medLength < subLength) {
                    this.substitutesTmp.pop();
                    this.substitutesMap.clear();
                } else {
                    this.medicationsTmp.push(id);
                }
                // map substitute to medication where medication is a key
                if (this.medicationsTmp.length === 1 && this.substitutesTmp.length === 1) {
                    this.substitutesMap.set(this.medicationsTmp.pop(), this.substitutesTmp.pop());
                    this.substitutesMap = [];
                    this.medicationsTmp = [];
                }
            }
            console.log(this.substitutesMap);
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
                    '/prescription/client/dispense',
                    dataToSend
                )
            ).then(function(response) {
                alertService.success('Send successful', response);
            });
        }
    }
})();
