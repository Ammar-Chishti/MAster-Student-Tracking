import axios from 'axios';
import FormData from 'form-data';
const url = (process.env.NODE_ENV === 'production') ? '' : 'https://localhost:8000';
// const url = 'ma-st.herokuapp.com';
axios.defaults.withCredentials = true; // allow cookies to be send cross-origin

class APIService {
  static async login (auth) {
    const res = await axios.post(url + '/api/login', auth).catch(() => {
      return {};
    });
    return res.data || {};
  }

  static async authenticate () {
    const res = await axios.post(url + '/api/authenticate').catch(() => {
      return {};
    });
    return res.data || {};
  }

  static async upload (api, file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(url + api, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).catch(() => {
      return {};
    });
    return res.data || {};
  }

  static async get (api) {
    const res = await axios.get(url + api).catch(() => {
      return [];
    });
    return res.data || [];
  }

  static async getOne (api) {
    const res = await axios.get(url + api).catch(() => {
      return {};
    });
    if (res.data === undefined) {
      return {};
    }
    return res.data || {};
  }

  static async post (api, json) {
    const res = await axios.post(url + api, json).catch((err) => {
      return { status: err.response.status };
    });
    return res;
  }

  static async delete (api) {
    const res = await axios.delete(url + api).catch((err) => {
      return { status: err.response.status };
    });
    return res;
  }

  static async put (api, json) {
    const res = await axios.put(url + api, json).catch((err) => {
      return { status: err.response.status };
    });
    return res;
  }
}

export default APIService;
