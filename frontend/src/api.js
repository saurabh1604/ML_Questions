import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const fetchDataset = async (type, n_samples, noise) => {
    const response = await axios.post(`${API_URL}/data`, { type, n_samples, noise });
    return response.data.data;
};

export const trainTree = async (data, params) => {
    const response = await axios.post(`${API_URL}/train/tree`, { data, ...params });
    return response.data;
};

export const trainForest = async (data, params) => {
    const response = await axios.post(`${API_URL}/train/forest`, { data, ...params });
    return response.data;
};

export const trainBoosting = async (data, params) => {
    const response = await axios.post(`${API_URL}/train/boosting`, { data, ...params });
    return response.data;
};
