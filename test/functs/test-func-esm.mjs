export async function handler(event, context) {
  return {"result": event.key, "context": context}
}
