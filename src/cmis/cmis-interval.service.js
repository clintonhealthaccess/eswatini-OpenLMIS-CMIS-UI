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
     * @name cmis.CmisIntervalService
     *
     * @description
     * Servis for actions related to medications intervals
     * 
     */
    angular.module('cmis').service('CmisIntervalService', CmisIntervalService);

    function CmisIntervalService() {
        this.countWeeklyDays = countWeeklyDays;

        function countWeeklyDays(days) {
            var daysNumber = parseInt(days, 10);
            var daysCounter = 1;
            var weeklyDaysCount = 1;

            for (var i = 0; i <= daysNumber; i++) {
                if (daysCounter === 6) {
                    daysCounter++;
                    continue;
                }
                if (daysCounter === 7) {
                    daysCounter = 1;
                    continue;
                }
                weeklyDaysCount ++;
                daysCounter ++;
            }
            return weeklyDaysCount;
        }
    }
})();
