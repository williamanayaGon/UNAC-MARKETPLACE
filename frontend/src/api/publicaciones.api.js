import client from './client'

export const publicacionesAPI = {
  listar: (params) => client.get('/publicaciones', { params }),
  obtener: (id) => client.get(`/publicaciones/${id}`),
  crear: (datos) => client.post('/publicaciones', datos),
  editar: (id, datos) => client.put(`/publicaciones/${id}`, datos),
  marcarVendida: (id) => client.put(`/publicaciones/${id}/vender`),
  misPublicaciones: () => client.get('/publicaciones/mis-publicaciones'),
  categorias: () => client.get('/publicaciones/categorias'),
}