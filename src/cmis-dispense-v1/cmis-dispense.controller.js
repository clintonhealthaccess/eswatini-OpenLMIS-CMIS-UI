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
/* eslint-disable */
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
        .controller('CmisDispenseControllerv1', CmisDispenseControllerv1);

    CmisDispenseControllerv1.$inject = [
        'CmisRequestService',
        '$stateParams',
        'user',
        'facility',
        'program',
        'visit',
        '$filter',
        '$q',
        '$scope',
        '$state',
        'CmisDispenseServicev1',
        'stateTrackerService',
        'loadingModalService',
        'orderables',
        'alertService',
        'messageService',
        'dateUtils',
        'ADJUSTMENT_TYPE',
        'adjustmentType',
        'confirmService',
        'stockAdjustmentCreationService',
        'UNPACK_REASONS',
        'reasons',
        'srcDstAssignments'
    ];

    function CmisDispenseControllerv1(
        CmisRequestService,
        $stateParams,
        user,
        facility,
        program,
        visit,
        $filter,
        $q,
        $scope,
        $state,
        CmisDispenseServicev1,
        stateTrackerService,
        loadingModalService,
        orderables,
        alertService,
        messageService,
        dateUtils,
        ADJUSTMENT_TYPE,
        adjustmentType,
        confirmService,
        stockAdjustmentCreationService,
        UNPACK_REASONS,
        reasons,
        srcDstAssignments
    ) {
        var vm = this;
        vm.$onInit = onInit;
        this.login = CmisRequestService.oauth2AuthorizationCall;
        this.isAuthorized = CmisRequestService.isUserAuthorized;

        vm.goToPreviousState = stateTrackerService.goToPreviousState;
        vm.visitId = $stateParams.visitId;
        vm.user = user;
        vm.facility = facility;
        vm.programs = facility.supportedPrograms;
        vm.selectedProgram = program;
        vm.visit = visit.data;
        //vm.adjustmentType = adjustmentType;
        vm.substituteTab = [];
        //vm.orderableGroup = orderableGroup.data;
        vm.selectedSubstitutes = [];
        vm.addedLineItems = [];
        vm.srcDstAssignments = srcDstAssignments;
        vm.reasons = reasons;
        vm.selectedMedications = [];
        vm.orderableGroupIndex = 0;
        vm.date = '';
        vm.reason = '';
        vm.notes = '';
        vm.orderables = orderables;
        vm.displayOrderables = {};

        vm.save = save;
        vm.addOrRemoveMedication = addOrRemoveMedication;
        // vm.addOrRemoveSubstitute = addOrRemoveSubstitute;
        // vm.updateOrderableIndex = updateOrderableIndex;

        // vm.removeProductWhenSubstitue = CmisDispenseService.removeProductWhenSubstitue;
        // vm.showSoHorError = CmisDispenseService.showSoHorError;
        vm.refreshMedicationData = CmisDispenseServicev1.refreshMedicationData;
        // vm.calculateQuantity = CmisDispenseService.calculateQuantity;
        // vm.showBalance = CmisDispenseService.showBalance;
        vm.onChangeProgram = onChangeProgram;
        vm.selectedProgramOrderables = selectedProgramOrderables;
        vm.getStockOnHand = getStockOnHand;
        vm.showBalance = CmisDispenseServicev1.showBalance;
        vm.calculateQuantity = CmisDispenseServicev1.calculateQuantity;
        vm.adjustmentType = adjustmentType;
        vm.srcDstAssignments = srcDstAssignments;

        function onInit() {
            //updateOrderableIndex();
            CmisRequestService.saveOath2Token();
            vm.date = $filter('isoDate')(new Date());
            //findSrcDestination();
        }

        function onChangeProgram(medication) {
            if (medication.selectedProgram) {
                vm.displayOrderables[medication.drug_id] = vm.orderables[medication.selectedProgram.programName].oderables;
            }
        }

        function selectedProgramOrderables(medication) {
            if (medication.selectedProgram) {
                return vm.orderables[medication.selectedProgram].oderables;
            }
            return [];
        }

        function getStockOnHand(medication) {
            if (medication.selectedProgram && medication.selectedOrderable) {
                return medication.selectedOrderable.stockOnHand;
            }
        }

        function addOrRemoveMedication(medication) {
            medication.$errors = {};
            CmisDispenseServicev1.cleanErrors(medication);

            if (medication.$selected) {
                CmisDispenseServicev1.refreshMedicationData(medication);
            } else {
                CmisDispenseServicev1.cleanMedicationData(medication);
            }
        }

        function gatherOlmisData() {
            var success = true;
            vm.addedLineItems = [];

            vm.visit.prescriptions.forEach(function(prescription) {
                prescription.medications.forEach(function(medication) {
                    var orderable;
                    if (!medication.$selected) {
                        return;
                    }

                    if (medication.$errors.noOrderable === 'No product found') {
                        alertService.error('You can not dispense medication without assigned product from OLMIS.' +
                            'Please try to use subsitute or contact administrator.');
                        success = false;
                        return;
                    }

                    if (medication.$errors.noStockOnHand === 'Product does\'nt have Stock on hand.') {
                        alertService.error('You can not dispense medication without Stock on hand.');
                        success = false;
                        return;
                    }

                    if (medication.$errors.balanceBelowZero === 'Balance below zero') {
                        alertService.error('Balance can\'t be below zero.');
                        success = false;
                        return;
                    }

                    //orderable = medication.selectedOrderable;
                    orderable = {};
                    orderable.quantity = medication.quantity;
                    orderable.program = {};
                    orderable.program = medication.selectedProgram;
                    orderable.orderable = {};
                    orderable.orderable['id'] = medication.selectedOrderable.oderableId;
                    orderable.$errors = {};
                    orderable.$previewSOH = orderable.stockOnHand;
                    //orderable.assignment = vm.srcDstAssignments[0];
                    orderable.reason = { id: '7c5fe940-1917-4f21-b25f-e909de3cf1b7' };
                    orderable.occurredDate = dateUtils.toStringDate(new Date());
                    orderable.assignment = vm.srcDstAssignments[0];

                    vm.addedLineItems.push(orderable);
                });
            });

            return success;
        }

        function gatherCmisData() {
            vm.selectedMedications = [];
            angular.forEach(vm.visit.prescriptions, function (prescription) {
                angular.forEach(
                    prescription.medications,
                    function (medication) {
                        var medicationJson = {};

                        if (!medication.$selected) {
                            return;
                        }
                        medicationJson = CmisRequestService.cmisMedicationBilder(
                            medication.medication_id,
                            medication.quantity,
                            vm.date,
                            vm.reason,
                            vm.notes
                        );
                        vm.selectedMedications.push(medicationJson);

                    }
                );
            });
        }

        function gatherData() {

            gatherCmisData();
            if (!gatherOlmisData()) {
                return false;
            }
            return true;
        }

        vm.createkey = function (secondaryKey) {
            return vm.adjustmentType.prefix + 'Creation.' + secondaryKey;
        };

        function validateData() {

            if (vm.selectedMedications.length === 0) {
                alertService.error('No data to send');
                return false;
            }
            return true;
        }

        function submitToStock() {

            var addedLineItems = angular.copy(vm.addedLineItems);

            // generateKitConstituentLineItem(addedLineItems);

            vm.programs.forEach(function (program) {
                var lineItems = $filter('filter')(addedLineItems, {
                    program: {
                        programId: program.id
                    }
                });
                if (lineItems.length > 0) {
                    submit(program, lineItems);
                }
            });

        }

        function submit(program, addedLineItems) {
            stockAdjustmentCreationService
                .submitAdjustments(program.id, vm.facility.id, addedLineItems, vm.adjustmentType)
                .then(function () {
                    if (offlineService.isOffline()) {
                        notificationService.offline(vm.createkey('submittedOffline'));
                    } else {
                        notificationService.success(vm.createkey('submitted'));
                    }
                    vm.goToPreviousState();
                }, function (errorResponse) {
                    loadingModalService.close();
                    alertService.error(errorResponse.data.message);
                });
        }

        function save() {

            if (!gatherData()) {
                return;
            }

            if (!validateData()) {
                return;
            }

            $scope.$broadcast('openlmis-form-submit');

            var confirmMessage = messageService.get(vm.createkey('confirmInfo'), {
                username: user.username,
                number: vm.addedLineItems.length
            });

            confirmService.confirm(confirmMessage, vm.createkey('confirm')).then(function () {
                loadingModalService.open();

                $q.resolve(
                    CmisRequestService.putRequest(
                        '/prescription/client/dispense',
                        {
                            data: vm.selectedMedications
                        }
                    )
                ).then(function (cmisResponse) {

                    if (cmisResponse.status === 200) {
                        submitToStock();
                        notificationService.success('Succesfully dispensed! Response: ' + cmisResponse.data);
                    } else {
                        notificationService.error('There was an error while dispensing. Error: ' + cmisResponse.data);
                    }

                },function(err){
                    console.log("error "+err);
                    loadingModalService.close();
                    notificationService.error('There was an error while dispensing. Error: ' + cmisResponse.data);
                })
                    .finally(function () {
                        loadingModalService.close();
                    });
            });

        }
    }
})();
