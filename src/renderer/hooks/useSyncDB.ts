import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useStore } from '../store/useStore'
import { useEffect } from 'react'

export const useSyncDB = () => {
  const collections = useLiveQuery(() => db.collections.toArray())
  const requests = useLiveQuery(() => db.requests.toArray())
  const history = useLiveQuery(() => db.history.orderBy('timestamp').reverse().limit(50).toArray())

  useEffect(() => {
    if (collections && requests && history) {
      useStore.setState({ collections, requests, history })
    }
  }, [collections, requests, history])
}
