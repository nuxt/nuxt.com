export interface SendGridSearchContactsResponse {
  result?: {
    [email: string]: {
      contact: {
        id: string
        email: string
        created_at: string
        updated_at: string
        list_ids?: string[]
      }
    }
  }
  contact_count?: number
}

export interface SendGridAddContactResponse {
  job_id?: string
}

// SendGrid returns 202 Accepted with no body on success
export interface SendGridEmailResponse {}

export interface SendGridError {
  message: string
  field?: string
  help?: string
}

export interface SendGridErrorResponse {
  errors?: SendGridError[]
}
