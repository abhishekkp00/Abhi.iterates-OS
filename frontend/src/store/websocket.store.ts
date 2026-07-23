import { create } from 'zustand'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from './auth.store'
import { API_BASE_URL } from '@/constants/app'
import { toast } from 'sonner'

export type WebSocketStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING'

interface WebSocketState {
  client: Client | null
  status: WebSocketStatus
  reconnectAttempts: number
  connect: () => void
  disconnect: () => void
  subscribe: (destination: string, callback: (payload: unknown) => void) => () => void
  sendMessage: (destination: string, body: unknown) => void
}

export const useWebSocketStore = create<WebSocketState>()((set, get) => {
  let stompClient: Client | null = null

  return {
    client: null,
    status: 'DISCONNECTED',
    reconnectAttempts: 0,

    connect: () => {
      // Avoid multiple connection attempts if already connecting or connected
      if (get().status === 'CONNECTED' || get().status === 'CONNECTING') return

      const accessToken = useAuthStore.getState().accessToken
      if (!accessToken) {
        console.warn('[WS] Cannot connect: No access token found.')
        return
      }

      set({ status: 'CONNECTING' })

      // Setup SockJS + Stomp client configuration
      const socketUrl = `${API_BASE_URL}/ws`
      const client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        reconnectDelay: 5000, // Reconnect strategy: retry every 5s

        onConnect: () => {
          set({ client, status: 'CONNECTED', reconnectAttempts: 0 })
          
          // Toast dynamic connection state to the user
          toast.success('Real-time sync established', {
            id: 'ws-status-toast',
            duration: 2000,
          })
        },

        onDisconnect: () => {
          set({ client: null, status: 'DISCONNECTED' })
        },

        onStompError: (frame) => {
          console.error('[WS] Stomp Error: ', frame.body)
          set({ status: 'DISCONNECTED' })
          toast.error('Real-time connection error', {
            id: 'ws-status-toast',
          })
        },

        onWebSocketClose: () => {
          if (get().status === 'CONNECTED') {
            console.warn('[WS] Socket closed unexpectedly. Reconnecting...')
            set({ status: 'RECONNECTING' })
            set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }))
          }
        },
      })

      stompClient = client
      client.activate()
    },

    disconnect: () => {
      if (stompClient) {
        stompClient.deactivate()
        stompClient = null
      }
      set({ client: null, status: 'DISCONNECTED', reconnectAttempts: 0 })
    },

    subscribe: (destination, callback) => {
      const activeClient = stompClient
      if (!activeClient || get().status !== 'CONNECTED') {
        console.warn(`[WS] Cannot subscribe to ${destination}. Socket is not connected.`)
        return () => {}
      }

      const subscription = activeClient.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          callback(payload)
        } catch (err) {
          console.error(`[WS] Failed to parse message body on ${destination}:`, err)
          callback(message.body)
        }
      })

      // Return cleanup function to unsubscribe when component unmounts
      return () => {
        subscription.unsubscribe()
      }
    },

    sendMessage: (destination, body) => {
      const activeClient = stompClient
      if (!activeClient || get().status !== 'CONNECTED') {
        console.warn(`[WS] Cannot send message to ${destination}. Socket is not connected.`)
        return
      }

      activeClient.publish({
        destination,
        body: JSON.stringify(body),
      })
    },
  }
})
