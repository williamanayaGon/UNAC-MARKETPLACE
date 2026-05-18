import client from './client'

export const authAPI = {
  registro: (datos) => client.post('/auth/registro', datos),
  login: (datos) => client.post('/auth/login', datos),
  perfil: () => client.get('/auth/perfil'),
  actualizarPerfil: (datos) => client.put('/auth/perfil', datos),
}