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
(function () {
    'use strict';

    angular
        .module('cmis-dispense')
        .config(routes);

    routes.$inject = ['$stateProvider', 'ADJUSTMENT_TYPE'];

    var locationURL = window.location.hostname;

    var MDESP_URL = "";

    if(locationURL.includes("elmis") || locationURL.startsWith("102.")){
        MDESP_URL = "https://elmis.eswatinimedicalstores.org:4433";
    }
    else{
        MDESP_URL = 'http://'+locationURL+":8082";
    }

    function routes($stateProvider, ADJUSTMENT_TYPE) {
        $stateProvider.state('openlmis.cmis.dispense-v1', {
            isOffline: true,
            url: '/dispense-v1',
            label: 'cmisDispense.dispense',
            priority: 2,
            params: {
                visitId: null
            },
            showInNavigation: false,
            views: {
                '@openlmis': {
                    controller: 'CmisDispenseControllerv1',
                    controllerAs: 'vm',
                    templateUrl: 'cmis-dispense-v1/cmis-dispense.html'
                }
            },
            resolve: {
                facility: function ($stateParams, facilityFactory) {
                    if (_.isUndefined($stateParams.facility)) {
                        return facilityFactory.getUserHomeFacility();
                    }
                    return $stateParams.facility;
                },
                program: function ($stateParams, facility, $filter) {
                    if (_.isUndefined($stateParams.program)) {
                        return $filter('orderBy')(facility.supportedPrograms, 'name')[0];
                    }
                    return $stateParams.program;
                },
                user: function ($stateParams, authorizationService) {
                    if (_.isUndefined($stateParams.user)) {
                        return authorizationService.getUser();
                    }
                    return $stateParams.user;
                },
                visit: function ($stateParams, CmisRequestService) {
                    if (_.isUndefined($stateParams.visit)) {
                        return CmisRequestService.getRequest('/prescription/client/' + $stateParams.visitId);

                    }
                    return $stateParams.visit;
                },
                orderables: function ($stateParams, CmisRequestService, facility) {
                    return CmisRequestService.postLMISRequest(MDESP_URL+'/api/lmis/fetchStockOnHand?facilityId=' + facility.id);
                },
                adjustmentType: function () {
                    return ADJUSTMENT_TYPE.ISSUE;
                },
                reasons: function ($stateParams, stockReasonsFactory, facility) {
                    if (_.isUndefined($stateParams.reasons)) {
                        return stockReasonsFactory.getIssueReasons($stateParams.programId, facility.type.id);
                    }
                    return $stateParams.reasons;
                },
                srcDstAssignments: function ($stateParams, program, facility, sourceDestinationService) {
                    if (_.isUndefined($stateParams.srcDstAssignments)) {
                        return [{ node: {} }];
                    }
                    return $stateParams.srcDstAssignments;
                }
            }
        });
    }
})();