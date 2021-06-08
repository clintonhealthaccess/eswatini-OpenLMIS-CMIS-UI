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
        .module('cmis-dispense')
        .config(routes);

    routes.$inject = ['$stateProvider'];

    function routes($stateProvider) {
        $stateProvider.state('openlmis.cmis.dispense', {
            isOffline: true,
            url: '/dispense',
            label: 'cmisDispense.dispense',
            priority: 2,
            params: {
                visitId: null
            },
            showInNavigation: false,
            views: {
                '@openlmis': {
                    controller: 'CmisDispenseController',
                    controllerAs: 'vm',
                    templateUrl: 'cmis-dispense/cmis-dispense.html'
                }
            },
            resolve: {
                facility: function($stateParams, facilityFactory) {
                    if (_.isUndefined($stateParams.facility)) {
                        return facilityFactory.getUserHomeFacility();
                    }
                    return $stateParams.facility;
                },
                user: function($stateParams, authorizationService) {
                    if (_.isUndefined($stateParams.user)) {
                        return authorizationService.getUser();
                    }
                    return $stateParams.user;
                },
                visit: function($stateParams, CmisRequestService) {
                    if (_.isUndefined($stateParams.visit)) {
                        return CmisRequestService.getRequest('/prescription/client/' + $stateParams.visitId);

                    }
                    return $stateParams.visit;
                },
                summaries: function(facility, orderableGroupService) {
                    return orderableGroupService.findAvailableProductsAndCreateOrderableGroups(
                        facility.supportedPrograms[0].id, facility.id, true
                    );
                }
            }
        });
    }
})();