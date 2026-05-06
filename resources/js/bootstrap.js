/**
 * سحب مكتبة axios للتعامل مع الـ API
 */
import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * إذا كنت تستخدم lodash أو أي مكتبات أخرى، يتم سحبها بـ import وليس require
 */
// import _ from 'lodash';
// window._ = _;