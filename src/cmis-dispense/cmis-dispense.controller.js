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
        'dateUtils'
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
        dateUtils

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
        vm.selectedOrderable = [];
        vm.addedLineItems = [];
        vm.srcDstAssignments = srcDstAssignments;
        vm.reasons = reasons;

        vm.date = '';
        vm.reason = '';
        vm.notes = '';

        vm.addSubstitute = addSubstitute;
        vm.save = save;
        vm.getSoH = getSoH;
        vm.substituteSelected = substituteSelected;
        vm.addOrRemoveMedication = addOrRemoveMedication;
        vm.addOrRemoveOrderable = addOrRemoveOrderable;

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

        /**
         * @ngdoc method
         * @methodOf stock-adjustment-creation.controller:StockAdjustmentCreationController
         * @name submit
         *
         * @description
         * Submit all added items.
         */
        vm.submit = function() {

            vm.selectedOrderable.forEach(function(orderable) {

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

            $scope.$broadcast('openlmis-form-submit');
            if (validateAllAddedItems()) {
                var confirmMessage = messageService.get(vm.key('confirmInfo'), {
                    username: user.username,
                    number: vm.addedLineItems.length
                });
                confirmService.confirm(confirmMessage, vm.key('confirm')).then(confirmSubmit);
            } else {
                vm.keyword = null;
                // reorderItems();
                alertService.error('stockAdjustmentCreation.submitInvalid');
            }
        };

        function addOrRemoveMedication(medication) {

            var orderable = getOrderableByProductCode(medication.code);
            if (!orderable) {
                // alertService.error('No orderable found for ' + medication.drug_name);
                // medication.$selected = false;
                return;
            }
            if (medication.$selected) {
                vm.selectedOrderable.push(orderable);
            } else {
                var index = vm.selectedOrderable.indexOf(orderable);
                vm.selectedOrderable.splice(index, 1);
            }
        }

        function addOrRemoveOrderable(orderable) {

            if (orderable.$selected) {
                vm.selectedOrderable.push(orderable);
            } else {
                var index = vm.selectedOrderable.indexOf(orderable);
                vm.selectedOrderable.splice(index, 1);
            }
        }

        function calculateMedications() {

            vm.visit.prescriptions.forEach(function(prescription) {
                prescription.medications.forEach(function(medication) {
                    medication.soh = getSoH('C100');
                    medication.balance = calculateInterval(medication);
                });
            });
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

        function getSoH(code) {

            var orderable = getOrderableByProductCode(code);
            return orderable[0][0].stockOnHand;
        }

        function calculateInterval(medication) {
            return medication.soh - medication.dose * medication.duration * INTERVAL.type[medication.interval];
        }

        function addSubstitute(substitute) {
            if (substitute.$selected === true) {
                vm.substituteTab.push(substitute);
            } else {
                substitute.quantity = 0;
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

        function confirmSubmit() {
            loadingModalService.open();

            var addedLineItems = angular.copy(vm.addedLineItems);

            // generateKitConstituentLineItem(addedLineItems);

            stockAdjustmentCreationService.submitAdjustments(program.id, facility.id, addedLineItems, adjustmentType)
                .then(function() {
                    if (offlineService.isOffline()) {
                        notificationService.offline(vm.key('submittedOffline'));
                    } else {
                        notificationService.success(vm.key('submitted'));
                    }
                }, function(errorResponse) {
                    loadingModalService.close();
                    alertService.error(errorResponse.data.message);
                });
        }

        // function generateKitConstituentLineItem(addedLineItems) {
        //     if (adjustmentType.state !== ADJUSTMENT_TYPE.KIT_UNPACK.state) {
        //         return;
        //     }

        //     //CREDIT reason ID
        //     var creditReason = {
        //         id: UNPACK_REASONS.UNPACKED_FROM_KIT_REASON_ID
        //     };

        //     var constituentLineItems = [];

        //     addedLineItems.forEach(function(lineItem) {
        //         lineItem.orderable.children.forEach(function(constituent) {
        //             constituent.reason = creditReason;
        //             constituent.occurredDate = lineItem.occurredDate;
        //             constituent.quantity = lineItem.quantity * constituent.quantity;
        //             constituentLineItems.push(constituent);
        //         });
        //     });

        //     addedLineItems.push.apply(addedLineItems, constituentLineItems);
        // }

        /**
         * Function search for duplicates in substitutes
         * @param {Table[Object]} substitutesTab
         * @returns true if no doplicates, false if duplicates occurs
         */
        function validateMedicationDuplicates(substitutesTab) {
            var tempSubtituteId = '';
            for (var x = 0; x < substitutesTab.length; x++) {
                tempSubtituteId = substitutesTab[x].orderable.id;
                for (var i = 0; i < substitutesTab.length; i++) {
                    if (x === i) {
                        continue;
                    }
                    if (tempSubtituteId === substitutesTab[i].orderable.id) {
                        return false;
                    }
                }
            }
            return true;
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
                                medication.substitute.quantity,
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

            if (!validateMedicationDuplicates(substitutesTab)) {
                // TODO add in messages
                alertService.error('Medications must have different substitutes!');
                return;
            }
            var dataToSend = {};

            dataToSend.data = selectedMedications;
            $q.resolve(
                CmisRequestService.putRequest(
                    '/prescription/client/dispense',
                    dataToSend
                )
            ).then(function(cmisResponse) {
                alertService.success('Send successful', cmisResponse);
                return cmisResponse;

            })
                .then(function() {
                    vm.submit();
                })
                .then(function() {
                    vm.goToPreviousState();
                });
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
    }
})();
