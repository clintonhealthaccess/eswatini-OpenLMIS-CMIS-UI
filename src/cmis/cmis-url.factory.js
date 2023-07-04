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
     * @name cmis.cmisUrlFactory
     *
     * @description
     * Supplies application with cmis URL.
     */
    angular
        .module('cmis')
        .factory('cmisUrlFactory', factory);

    factory.$inject = [];

    function factory() {

        var cmisUrl = '@@CMIS_SERVICE_URL';

        if (cmisUrl.substr(0, 2) === '@@') {
            cmisUrl = '';
        }

        /**
     * @ngdoc method
     * @methodOf cmis.cmisUrlFactory
     * @name cmisUrlFactory
     *
     * @description
     * It parses the given URL and appends cmis service URL to it.
     *
     * @param  {String} url cmis URL from grunt file
     * @return {String}     cmis URL
     */
        return function(url) {
            /*return 'http://10.255.67.130:8093/PrescriptionService.svc' + url;*/
            return 'http://102.222.132.153:4433/cmis/v1/PrescriptionService.svc' + url;
        };
    }
})();
