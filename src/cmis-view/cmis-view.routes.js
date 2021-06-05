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

    angular
        .module('cmis-view')
        .config(routes);

    routes.$inject = ['$stateProvider'];

    function routes($stateProvider) {
        $stateProvider.state('openlmis.cmis.view', {
            isOffline: true,
            url: '/view',
            label: 'cmisView.view',
            priority: 2,
            showInNavigation: true,
            views: {
                '@openlmis': {
                    controller: 'CmisViewController',
                    controllerAs: 'vm',
                    templateUrl: 'cmis-view/cmis-view.html'
                }
            },
            resolve: {
                facility: function(facilityFactory) {
                    return facilityFactory.getUserHomeFacility();
                },
                user: function(authorizationService) {
                    return authorizationService.getUser();
                },
                clients: function(CmisRequestService, facility) {
                    console.log(facility.code);
                    return CmisRequestService.getRequest('https://eswantest.free.beeceptor.com/prescription/clients/' +
                    facility.code);
                }
            }
        });
    }
})();