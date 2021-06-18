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
        'INTERVAL',
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
        'CmisIntervalService'
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
        INTERVAL,
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
        CmisIntervalService

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
        vm.program = program;
        vm.visit = visit.data;
        vm.substituteTab = [];
        vm.orderableGroup = orderableGroup;
        vm.selectedSubstitutes = [];
        vm.addedLineItems = [];
        vm.srcDstAssignments = srcDstAssignments;
        vm.reasons = reasons;
        vm.selectedMedications = [];

        vm.date = '';
        vm.reason = '';
        vm.notes = '';

        // vm.addSubstitute = addSubstitute;
        vm.save = save;
        vm.addOrRemoveMedication = addOrRemoveMedication;
        vm.addOrRemoveSubstitute = addOrRemoveSubstitute;
        vm.calculateQuantity = calculateQuantity;

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
            findSrcDesination();
        }

        function findSrcDesination() {
            vm.srcDstAssignments = $filter('filter')(vm.srcDstAssignments, {
                // name: 'Lobamba - Child welfare'
                name: 'F.E. Patient'
            });
        }

        function addOrRemoveMedication(medication) {

            var orderable = getOrderableByProductCode(medication.code);

            if (!orderable && medication.$selected) {
                medication.$errors = {};
                medication.$errors.noOrderable = 'No product found';
                return;
            }

            if (medication.$selected) {
                medication.orderable = orderable[0][0];
                medication.quantity = calculateQuantity(medication);
                // medication.orderable.quantity = medication.quantity;
                medication.balance = medication.orderable.stockOnHand - medication.quantity;
            } else {
                medication.$errors = null;
                medication.orderable = null;
                medication.quantity = null;
                medication.balance = null;
                medication.substitute = null;
            }
        }

        function addOrRemoveSubstitute(orderable) {

            if (orderable.$selected) {
                vm.selectedSubstitutes.push(orderable);
            } else {
                var index = vm.selectedSubstitutes.indexOf(orderable);
                vm.selectedSubstitutes.splice(index, 1);
                deleteSubstituteFromMedications(orderable);
                orderable.quantity = null;
                orderable.$errors = {};
            }
        }

        function getOrderableByProductCode(productCode) {

            if (productCode) {
                return $filter('filter')(vm.orderableGroup, {
                    orderable: {
                        productCode: productCode
                    }
                });
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

            stockAdjustmentCreationService.submitAdjustments(program.id, facility.id, addedLineItems, adjustmentType)
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
                // TODO add in messages
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
                        orderable = medication.orderable;
                        orderable.quantity = medication.quantity;
                    }

                    orderable.$errors = {};
                    orderable.$previewSOH = orderable.stockOnHand;
                    orderable.assignment = vm.srcDstAssignments[0];
                    orderable.reason = (adjustmentType.state === ADJUSTMENT_TYPE.KIT_UNPACK.state)
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
         * @methodOf stock-adjustment-creation.controller:StockAdjustmentCreationController
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
         * @methodOf stock-adjustment-creation.controller:StockAdjustmentCreationController
         * @name validateAssignment
         *
         * @description
         * Validate line item assignment and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateAssignment = function(lineItem) {
            if (adjustmentType.state !== ADJUSTMENT_TYPE.ADJUSTMENT.state &&
                adjustmentType.state !== ADJUSTMENT_TYPE.KIT_UNPACK.state) {
                lineItem.$errors.assignmentInvalid = isEmpty(lineItem.assignment);
            }
            return lineItem;
        };

        /**
         * @ngdoc method
         * @methodOf stock-adjustment-creation.controller:StockAdjustmentCreationController
         * @name validateReason
         *
         * @description
         * Validate line item reason and returns self.
         *
         * @param {Object} lineItem line item to be validated.
         */
        vm.validateReason = function(lineItem) {
            if (adjustmentType.state === 'adjustment') {
                lineItem.$errors.reasonInvalid = isEmpty(lineItem.reason);
            }
            return lineItem;
        };

        /**
         * @ngdoc method
         * @methodOf stock-adjustment-creation.controller:StockAdjustmentCreationController
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
         * @propertyOf stock-adjustment-creation.controller:StockAdjustmentCreationController
         * @name offline
         * @type {boolean}
         *
         * @description
         * Holds information about internet connection
         */
        vm.offline = offlineService.isOffline;

        vm.key = function(secondaryKey) {
            return adjustmentType.prefix + 'Creation.' + secondaryKey;
        };

        function calculateQuantity(medication) {
            var dose = parseInt(medication.dose, 10);
            var duration = parseInt(medication.duration, 10);
            var intervalType = INTERVAL.type[medication.interval];
            var quantity = 0;

            if (intervalType === INTERVAL.type.wd) {
                var weeklyDays = CmisIntervalService.countWeeklyDays(duration);

                quantity = (dose * weeklyDays);

                return quantity;
            }
            if (intervalType === INTERVAL.type.pm) {
                medication.hasOwnInterval = true;
                quantity = (dose * duration * medication.ownInterval);
                return quantity;
            }
            quantity = (dose * duration * intervalType);
            return quantity;
        }

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
                    notificationService.success('Succesfully dispensed! Response: ' + cmisResponse);

                })
                    .then(function() {
                        submitToStock();
                    });
            });
        }
    }
})();
