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

    routes.$inject = ['$stateProvider', 'ADJUSTMENT_TYPE'];

    function routes($stateProvider, ADJUSTMENT_TYPE) {
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
                program: function($stateParams, facility) {
                    if (_.isUndefined($stateParams.program)) {
                        return facility.supportedPrograms[0];
                    }
                    return $stateParams.program;
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
                orderableGroup: function(facility, orderableGroupService, $stateParams, $q) {
                    if (!$stateParams.orderableGroups) {
                        var tempObject = [];
                        var data = [];
                        facility.supportedPrograms.forEach(function(program) {
                            $q.resolve(
                                orderableGroupService.findAvailableProductsAndCreateOrderableGroups(
                                    program.id, facility.id, true
                                )
                            ).then(function(response) {
                                tempObject = {
                                    program: program,
                                    orderableGroup: response
                                };
                                data.push(tempObject);
                            });
                        });
                        return {
                            data: data
                        };
                    }
                    return $stateParams.orderableGroups;
                },
                reasons: function($stateParams, stockReasonsFactory, facility) {
                    if (_.isUndefined($stateParams.reasons)) {
                        return stockReasonsFactory.getIssueReasons($stateParams.programId, facility.type.id);
                    }
                    return $stateParams.reasons;
                },
                adjustmentType: function() {
                    return ADJUSTMENT_TYPE.ISSUE;
                },
                srcDstAssignments: function($stateParams, program, facility, sourceDestinationService) {
                    if (_.isUndefined($stateParams.srcDstAssignments)) {
                        return sourceDestinationService.getDestinationAssignments(
                            program.id, facility.id
                        );
                    }
                    return $stateParams.srcDstAssignments;
                }
            }
        });
    }
})();