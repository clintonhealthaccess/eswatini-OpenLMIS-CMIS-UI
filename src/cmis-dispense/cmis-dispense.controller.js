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
        'program',
        'visit',
        'stateTrackerService',
        'orderableGroup',
        '$filter',
        '$q',
        'alertService',
        'srcDstAssignments',
        '$scope',
        'messageService',
        'confirmService',
        'REASON_TYPES',
        'MAX_INTEGER_VALUE',
        'ADJUSTMENT_TYPE',
        'adjustmentType',
        'loadingModalService',
        'stockAdjustmentCreationService',
        'offlineService',
        'notificationService',
        '$state',
        'UNPACK_REASONS',
        'reasons',
        'dateUtils',
        'CmisDispenseService'
    ];

    function CmisDispenseController(
        CmisRequestService,
        $stateParams,
        user,
        facility,
        program,
        visit,
        stateTrackerService,
        orderableGroup,
        $filter,
        $q,
        alertService,
        srcDstAssignments,
        $scope,
        messageService,
        confirmService,
        REASON_TYPES,
        MAX_INTEGER_VALUE,
        ADJUSTMENT_TYPE,
        adjustmentType,
        loadingModalService,
        stockAdjustmentCreationService,
        offlineService,
        notificationService,
        $state,
        UNPACK_REASONS,
        reasons,
        dateUtils,
        CmisDispenseService

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
        vm.adjustmentType = adjustmentType;
        vm.substituteTab = [];
        vm.orderableGroup = orderableGroup.data;
        vm.selectedSubstitutes = [];
        vm.addedLineItems = [];
        vm.srcDstAssignments = srcDstAssignments;
        vm.reasons = reasons;
        vm.selectedMedications = [];
        vm.orderableGroupIndex = 0;
        vm.date = '';
        vm.reason = '';
        vm.notes = '';

        vm.save = save;
        vm.addOrRemoveMedication = addOrRemoveMedication;
        vm.addOrRemoveSubstitute = addOrRemoveSubstitute;
        vm.updateOrderableIndex = updateOrderableIndex;

        vm.removeProductWhenSubstitue = CmisDispenseService.removeProductWhenSubstitue;
        vm.showSoHorError = CmisDispenseService.showSoHorError;
        vm.refreshMedicationData = CmisDispenseService.refreshMedicationData;
        vm.calculateQuantity = CmisDispenseService.calculateQuantity;
        vm.showBalance = CmisDispenseService.showBalance;

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name $onInit
         *
         * @description
         * Initialization method of the CmisDispenseController.
         */
        function onInit() {
            updateOrderableIndex();
            CmisRequestService.saveOath2Token();
            vm.date = $filter('isoDate')(new Date());
            findSrcDestination();
        }

        function findSrcDestination() {
            vm.srcDstAssignments = $filter('filter')(vm.srcDstAssignments, {
                name: 'F.E. Patient'
            });
        }

        function addOrRemoveMedication(medication) {
            medication.$errors = {};
            CmisDispenseService.cleanErrors(medication);

            var orderables = getOrderablesByGenericName(medication.drug_name);

            if (orderables.length === 0 && medication.$selected) {
                medication.$errors.noOrderable = 'No product found';
                return;
            }

            if (medication.$selected) {
                if (orderables.length === 1) {
                    medication.selectedOrderable = orderables[0];
                }
                medication.orderables = orderables;
                CmisDispenseService.refreshMedicationData(medication);

            } else {
                CmisDispenseService.cleanMedicationData(medication);
            }
        }

        function getOrderablesByGenericName(productName) {
            var orderables = null;
            if (productName) {
                orderables = findOrderables(productName);
                if (orderables === null || orderables.length === 0) {
                    return findOrderables(productName.substring(0, 5));
                }
            }
            return orderables;
        }

        function findOrderables(productName) {
            var orderable = [];
            vm.orderableGroup.forEach(function(group) {
                group.orderableGroup.forEach(function(orderables) {
                    var tempOrderable = $filter('filter')(orderables, {
                        orderable: {
                            fullProductName: productName
                        }
                    });
                    if (tempOrderable.length > 0) {
                        tempOrderable[0].program = group.program;
                        orderable.push(tempOrderable[0]);
                    }
                });
            });
            return orderable;
        }

        function addOrRemoveSubstitute(orderable) {

            if (orderable.$selected) {
                orderable.program = vm.selectedProgram;
                vm.selectedSubstitutes.push(orderable);
            } else {
                var index = vm.selectedSubstitutes.indexOf(orderable);
                vm.selectedSubstitutes.splice(index, 1);
                deleteSubstituteFromMedications(orderable);
                orderable.quantity = null;
                orderable.$errors = {};
            }
        }

        function deleteSubstituteFromMedications(substitute) {
            angular.forEach(vm.prescriptions, function(prescription) {
                angular.forEach(prescription.medications, function(medication) {
                    if (medication.substitute.orderable.id === substitute.orderable.id) {
                        medication.substitute = null;
                    }
                });
            });
        }

        function submitToStock() {

            var addedLineItems = angular.copy(vm.addedLineItems);

            // generateKitConstituentLineItem(addedLineItems);

            vm.programs.forEach(function(program) {
                var lineItems = $filter('filter')(addedLineItems, {
                    program: {
                        id: program.id
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
                .then(function() {
                    if (offlineService.isOffline()) {
                        notificationService.offline(vm.key('submittedOffline'));
                    } else {
                        notificationService.success(vm.key('submitted'));
                    }
                    vm.goToPreviousState();
                }, function(errorResponse) {
                    loadingModalService.close();
                    alertService.error(errorResponse.data.message);
                });
        }

        function validateData() {

            if (!validateMedicationDuplicates()) {
                alertService.error('Medications must have different substitutes!');
                return false;
            }
            if (vm.selectedMedications.length === 0) {
                alertService.error('No data to send');
                return false;
            }

            if (!validateAllAddedItems()) {
                vm.keyword = null;
                // reorderItems();
                alertService.error('stockAdjustmentCreation.submitInvalid');
                return false;
            }

            return true;
        }

        function gatherData() {

            gatherCmisData();
            if (!gatherOlmisData()) {
                return false;
            }
            return true;
        }

        function gatherCmisData() {
            vm.selectedMedications = [];
            angular.forEach(vm.visit.prescriptions, function(prescription) {
                angular.forEach(
                    prescription.medications,
                    function(medication) {
                        var medicationJson = {};

                        if (!medication.$selected) {
                            return;
                        }

                        if (medication.substitute) {
                            medicationJson = CmisRequestService.cmisMedicationBilder(
                                medication.medication_id,
                                medication.substitute.quantity,
                                vm.date,
                                vm.reason,
                                vm.notes
                            );
                            vm.selectedMedications.push(medicationJson);

                        } else {
                            medicationJson = CmisRequestService.cmisMedicationBilder(
                                medication.medication_id,
                                medication.quantity,
                                vm.date,
                                vm.reason,
                                vm.notes
                            );
                            vm.selectedMedications.push(medicationJson);
                        }
                    }
                );
            });
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
                    if (medication.substitute) {
                        orderable = medication.substitute;
                    } else {
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

                        orderable = medication.selectedOrderable;
                        orderable.quantity = medication.quantity;
                    }

                    orderable.$errors = {};
                    orderable.$previewSOH = orderable.stockOnHand;
                    orderable.assignment = vm.srcDstAssignments[0];
                    orderable.reason = (vm.adjustmentType.state === ADJUSTMENT_TYPE.KIT_UNPACK.state)
                        ? {
                            id: UNPACK_REASONS.KIT_UNPACK_REASON_ID
                        } : vm.reasons[0];
                    orderable.occurredDate = dateUtils.toStringDate(new Date());
                    orderable.assignment = vm.srcDstAssignments[0];

                    vm.addedLineItems.push(orderable);
                });
            });

            return success;
        }

        /**
         * Function search for duplicates in substitutes
         * @param {Table[Object]} substitutesTab
         * @returns true if no doplicates, false if duplicates occurs
         */
        function validateMedicationDuplicates() {
            var bool = true;
            var medications = [];
            vm.visit.prescriptions.forEach(function(prescription) {
                prescription.medications.forEach(function(medication) {
                    medications.push(medication);
                });
            });

            vm.selectedSubstitutes.forEach(function(substitute) {
                if ($filter('filter')(medications, {
                    substitute:
                    {
                        orderable: {
                            id: substitute.orderable.id
                        }
                    }
                }, true).length > 1) {
                    bool = false;
                }
            });

            return bool;
        }

        function isEmpty(value) {
            return _.isUndefined(value) || _.isNull(value);
        }

        function validateAllAddedItems() {
            _.each(vm.addedLineItems, function(item) {
                vm.validateQuantity(item);
                vm.validateDate(item);
                vm.validateAssignment(item);
                vm.validateReason(item);
            });
            return _.chain(vm.addedLineItems)
                .groupBy(function(item) {
                    return item.lot ? item.lot.id : item.orderable.id;
                })
                .values()
                .flatten()
                .all(isItemValid)
                .value();
        }

        function isItemValid(item) {
            return _.chain(item.$errors).keys()
                .all(function(key) {
                    return item.$errors[key] === false;
                })
                .value();
        }

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name validateQuantity
         *
         * @description
         * Validate line item quantity and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateQuantity = function(lineItem) {
            if (lineItem.quantity > lineItem.$previewSOH && lineItem.reason
                    && lineItem.reason.reasonType === REASON_TYPES.DEBIT) {
                lineItem.$errors.quantityInvalid = messageService
                    .get('stockAdjustmentCreation.quantityGreaterThanStockOnHand');
            } else if (lineItem.quantity > MAX_INTEGER_VALUE) {
                lineItem.$errors.quantityInvalid = messageService.get('stockmanagement.numberTooLarge');
            } else if (lineItem.quantity >= 1) {
                lineItem.$errors.quantityInvalid = false;
            } else {
                lineItem.$errors.quantityInvalid = messageService.get(vm.key('positiveInteger'));
            }
            return lineItem;
        };

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name validateAssignment
         *
         * @description
         * Validate line item assignment and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateAssignment = function(lineItem) {
            if (vm.adjustmentType.state !== ADJUSTMENT_TYPE.ADJUSTMENT.state &&
                vm.adjustmentType.state !== ADJUSTMENT_TYPE.KIT_UNPACK.state) {
                lineItem.$errors.assignmentInvalid = isEmpty(lineItem.assignment);
            }
            return lineItem;
        };

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name validateReason
         *
         * @description
         * Validate line item reason and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateReason = function(lineItem) {
            if (vm.adjustmentType.state === 'adjustment') {
                lineItem.$errors.reasonInvalid = isEmpty(lineItem.reason);
            }
            return lineItem;
        };

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name validateDate
         *
         * @description
         * Validate line item occurred date and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateDate = function(lineItem) {
            lineItem.$errors.occurredDateInvalid = isEmpty(lineItem.occurredDate);
            return lineItem;
        };

        /**
         * @ngdoc property
         * @propertyOf cmis-dispense.controller:CmisDispenseController
         * @name offline
         * @type {boolean}
         *
         * @description
         * Holds information about internet connection
         */
        vm.offline = offlineService.isOffline;

        /**
         * @ngdoc method
         * @methodOf cmis-dispense.controller:CmisDispenseController
         * @name updateOrderableIndex
         *
         * @description
         * Validate line item occurred date and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        function updateOrderableIndex() {
            loadingModalService.open();
            vm.orderableGroup.forEach(function(group, index) {
                if (group.program.id === vm.selectedProgram.id) {
                    vm.orderableGroupIndex = index;
                }
            });
            loadingModalService.close();
        }

        vm.key = function(secondaryKey) {
            return vm.adjustmentType.prefix + 'Creation.' + secondaryKey;
        };

        function save() {

            if (!gatherData()) {
                return;
            }
            if (!validateData()) {
                return;
            }

            $scope.$broadcast('openlmis-form-submit');

            var confirmMessage = messageService.get(vm.key('confirmInfo'), {
                username: user.username,
                number: vm.addedLineItems.length
            });

            confirmService.confirm(confirmMessage, vm.key('confirm')).then(function() {
                loadingModalService.open();

                $q.resolve(
                    CmisRequestService.putRequest(
                        '/prescription/client/dispense',
                        {
                            data: vm.selectedMedications
                        }
                    )
                ).then(function(cmisResponse) {

                    if (cmisResponse.status === 200) {
                        notificationService.success('Succesfully dispensed! Response: ' + cmisResponse.data);
                        submitToStock();
                    } else {
                        notificationService.error('There was an error while dispensing. Error: ' + cmisResponse.data);
                    }

                })
                    .then(function() {
                        loadingModalService.close();
                    });
            });
        }
    }
})();
