import client from './client'

export const ofertasAPI = {
  enviar: (datos) => client.post('/ofertas', datos),
  recibidas: () => client.get('/ofertas/recibidas'),
  enviadas: () => client.get('/ofertas/enviadas'),
  aceptar: (id) => client.put(`/ofertas/${id}/aceptar`),
  rechazar: (id) => client.put(`/ofertas/${id}/rechazar`),
  contraoferta: (id, monto) => client.put(`/ofertas/${id}/contraoferta`, { monto_contraoferta: monto }),
}