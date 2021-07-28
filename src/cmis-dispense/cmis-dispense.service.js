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
     * @ngdoc service
     * @name cmis-dispense.CmisDispenseService
     *
     * @description
     * Application layer service that prepares domain objects to be used on the view.
     */
    angular
        .module('cmis-dispense')
        .service('CmisDispenseService', CmisDispenseService);

    CmisDispenseService.$inject = [
        '$q', 'CmisIntervalService', 'INTERVAL'
    ];

    function CmisDispenseService($q, CmisIntervalService, INTERVAL) {
        this.showSoHorError = showSoHorError;
        this.showBalance = showBalance;
        this.refreshMedicationData = refreshMedicationData;
        this.cleanErrors = cleanErrors;
        this.cleanMedicationData = cleanMedicationData;
        this.calculateBalance = calculateBalance;
        this.calculateQuantity = calculateQuantity;
        this.removeProductWhenSubstitue = removeProductWhenSubstitue;

        function showSoHorError(medication) {
            if (!medication.$errors) {
                return;
            } else if (medication.$errors.noOrderable) {
                return medication.$errors.noOrderable;
            } else if (medication.$errors.noStockOnHand) {
                return medication.$errors.noStockOnHand;
            } else if (!medication.selectedOrderable && medication.substitute) {
                return 'From Substitute: ' + medication.substitute.stockOnHand;
            } else if (medication.selectedOrderable && medication.selectedOrderable.stockOnHand) {
                return medication.selectedOrderable.stockOnHand;
            }
        }

        function showBalance(medication) {
            if (!medication.$errors) {
                return;
            } else if (medication.$errors.balanceBelowZero) {
                return medication.$errors.balanceBelowZero;
            } else if (medication.substitute) {
                medication.balance = 'From substitute: ' + medication.substitute.balance;
            } else if (medication.selectedOrderable) {
                calculateBalance(medication);
            } else {
                medication.balance = null;
            }

            return medication.balance;
        }

        function refreshMedicationData(medication) {
            calculateQuantity(medication);

            if (!medication.selectedOrderable) {
                cleanErrors(medication);
                medication.balance = null;
                medication.$errors.noOrderable = 'No product found';
                return;
            }

            if (medication.selectedOrderable.stockOnHand) {
                medication.$errors.noStockOnHand = null;
                medication.$errors.noOrderable = null;
                calculateBalance(medication);
            } else {
                medication.$errors.noStockOnHand = 'Product doesn\'t have Stock on hand.';
                medication.balance = null;
            }
        }

        function cleanErrors(medication) {
            medication.$errors.noStockOnHand = null;
            medication.$errors.noOrderable = null;
            medication.$errors.balanceBelowZero = null;
        }

        function cleanMedicationData(medication) {
            cleanErrors(medication);
            calculateQuantity(medication);
            medication.selectedOrderable = null;
            medication.orderables = null;
            medication.balance = null;
            medication.substitute = null;
        }

        function calculateBalance(medication) {
            var balance = medication.selectedOrderable.stockOnHand - medication.quantity;

            if (balance < 0) {
                medication.$errors.balanceBelowZero = 'Balance below zero';
            } else {
                medication.$errors.balanceBelowZero = null;
            }
            medication.balance = balance;
        }

        function calculateQuantity(medication) {
            var dose = parseInt(medication.dose, 10);
            var duration = parseInt(medication.duration, 10);
            var intervalType = INTERVAL.type[medication.interval];

            if (intervalType === INTERVAL.type.wd) {
                var weeklyDays = CmisIntervalService.countWeeklyDays(duration);
                medication.quantity = (dose * weeklyDays);
            } else if (intervalType === INTERVAL.type.pm) {
                medication.hasOwnInterval = true;
                medication.quantity = (dose * duration * medication.ownInterval);
            } else {
                medication.quantity = (dose * duration * intervalType);
            }
        }

        function removeProductWhenSubstitue(medication) {
            if (medication.substitute) {
                medication.selectedOrderable = null;
                cleanErrors(medication);
            }
        }
    }
})();
