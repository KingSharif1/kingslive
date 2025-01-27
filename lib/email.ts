import axios from 'axios';

export const emailApi = axios.create({
  baseURL: 'https://api.sendinblue.com/v3',
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json'
  }
});
