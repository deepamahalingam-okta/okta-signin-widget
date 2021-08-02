/*!
 * Copyright (c) 2021, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import config from 'config/config.json';

export function configureClient(appState, settings) {
  const authClient = settings.getAuthClient();
  // Enrich the extended user agent
  authClient._oktaUserAgent.addEnvironment(`okta-signin-widget-${config.version}`);

  // Add fingerprint header if applicable
  const fingerprint = appState.get('deviceFingerprint');
  if (fingerprint) {
    authClient.http.setRequestHeader('X-Device-Fingerprint', fingerprint);
  }
}
