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
     * @name cmis.CmisRequestService
     *
     * @description
     * Application layer service that prepares thins related to authentication and requests
     * to perscription API.
     */
    angular.module('cmis').service('CmisRequestService', CmisRequestService);

    CmisRequestService.$inject = ['$q', '$http', 'cmisUrlFactory'];

    function CmisRequestService($q, $http, cmisUrlFactory) {
        this.postRequest = doPost;
        this.getRequest = doGet;
        this.putRequest = doPut;
        this.saveOath2Token = saveOath2Token;
        this.oauth2AuthorizationCall = oauth2AuthorizationCall;
        this.isUserAuthorized = isUserAuthorized;

        /**
         *
         * @param {String} url Url for request.
         * @param {JSON} data Data to send.
         * @returns {Promise} Promise with POST request.
         */
        function doPost(url, data) {
            var dataPromise = null;
            var authHeader = buildRequestHeader();
            if (authHeader !== null) {
                dataPromise = $http.post(
                    cmisUrlFactory(url),
                    data
                ).defaults.headers.common.Authentication = authHeader
                    .then(function(response) {
                        return response.data;
                    })
                    .catch(function() {
                        return $q.reject();
                    });
            }
            return dataPromise;
        }

        /**
         *
         * @param {String} url Url for request.
         * @returns {Promise} Promise with GET request.
         */
        function doGet(url) {
            // var dataPromise = null;
            // var authHeader = buildRequestHeader();
            // if (authHeader !== null) {
            //     dataPromise = $http.get(
            //         cmisUrlFactory(url)
            //     ).defaults.headers.common.Authentication = authHeader
            //         .then(function(response) {
            //             return response.data;
            //         })
            //         .catch(function() {
            //             return $q.reject();
            //         });
            // }
            // var data = {
            //     data: null
            // };
            var dataPromise = $http
                .get(cmisUrlFactory(url))
                .then(function(response) {
                    if (
                        response.data.message ===
                        'Wrong parameters or prescription expired'
                    ) {
                        return {
                            data: {}
                        };
                    }
                    return response.data;
                })
                .catch(function() {
                    return $q.reject();
                });
            return dataPromise;
        }

        /**
         *
         * @param {String} url Url for request.
         * @param {JSON} data Data to send.
         * @returns {Promise} Promise with PUT request.
         */
        function doPut(url, data) {
            var dataPromise = null;
            dataPromise = $http
                .post(cmisUrlFactory(url), data)
                .then(function(response) {
                    return response.data;
                })
                .catch(function() {
                    return $q.reject();
                });

            return dataPromise;
        }

        /**
         * @description
         * Function that catches url every time prescription form is visited,
         * if url contains token it will be saved in localStorage.
         */
        function saveOath2Token() {
            var callbackResponse = document.URL.split('#&')[1];
            if (callbackResponse === undefined || callbackResponse === null) {
                return;
            }
            var responseParameters = callbackResponse.split('&');
            var parameterMap = [];
            for (var i = 0; i < responseParameters.length; i++) {
                parameterMap[responseParameters[i].split('=')[0]] =
                    responseParameters[i].split('=')[1];
            }
            if (
                parameterMap.accessToken !== undefined &&
                parameterMap.accessToken !== null
            ) {
                var oauthAccess = {
                    oauth: {
                        accessToken: parameterMap.accessToken,
                        expiresIn: parameterMap.expires_in,
                        accountUsrname: parameterMap.account_username
                    }
                };
                window.localStorage.setItem(
                    'authAccess',
                    JSON.stringify(oauthAccess)
                );
                window.history.pushState(
                    {},
                    document.title,
                    callbackResponse[0]
                );
            } else {
                alert('Problem authenticating');
            }
        }

        /**
         * @description
         * Function makes call to Oauth2 prescription server with api id
         */
        function oauth2AuthorizationCall() {
            window.location.href = 'https://oauth2authorizationlink + ID';
            /**
             * example 'https://api.imgur.com/oauth2/authorize?client_id=6d415061862ff9e&response_type=token'
             */
        }

        /**
         *
         * @returns object that contains if user is logged in or not,
         * and optional user information with request token
         */
        function isUserAuthorized() {
            var userInformation = {};
            if (
                JSON.parse(window.localStorage.getItem('oauthAccess')) !== null
            ) {
                userInformation.token = JSON.parse(
                    window.localStorage.getItem('oauthAccess')
                ).oauth.accessToken;
                userInformation.isLoggedIn = true;
                return userInformation;
            }

            userInformation.isLoggedIn = false;
            return userInformation;
        }

        /**
         * @description
         * Function build and returns Authentication header
         * eg: Bearer access_token
         */
        function buildRequestHeader() {
            var requestHeader = null;

            if (isUserAuthorized().isLoggedIn) {
                requestHeader =
                    'Bearer ' + isUserAuthorized().oauth.access_token;
            }
            return requestHeader;
        }
    }
})();
