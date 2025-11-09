export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allowed_school_domains: {
        Row: {
          active: boolean | null
          created_at: string
          domain: string
          id: string
          school_name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          domain: string
          id?: string
          school_name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          domain?: string
          id?: string
          school_name?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string
          design_doc_url: string | null
          id: string
          optional_answers: Json | null
          project_id: string
          status: Database["public"]["Enums"]["application_status"]
          team_lead_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          design_doc_url?: string | null
          id?: string
          optional_answers?: Json | null
          project_id: string
          status?: Database["public"]["Enums"]["application_status"]
          team_lead_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          design_doc_url?: string | null
          id?: string
          optional_answers?: Json | null
          project_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          team_lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "trending_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          id: string
          location: string | null
          logo_url: string | null
          name: string
          sector: Database["public"]["Enums"]["industry_sector"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain: string
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          sector?: Database["public"]["Enums"]["industry_sector"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          sector?: Database["public"]["Enums"]["industry_sector"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      project_views: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "trending_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          access_type: Database["public"]["Enums"]["project_access_type"]
          collaboration_style: string
          company_id: string
          confidentiality: Database["public"]["Enums"]["confidentiality_type"]
          contact_email: string
          contact_name: string
          contact_role: string
          created_at: string
          created_by_id: string
          deliverables: string
          detailed_description: string
          end_date: string | null
          id: string
          internal_notes: string | null
          location: string | null
          max_students: number
          max_teams: number | null
          mentorship: Database["public"]["Enums"]["mentorship_preference"]
          min_students: number
          open_date: string | null
          project_type: string[]
          resource_files: string[] | null
          resource_links: string | null
          short_summary: string
          skills_needed: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
          weekly_hours: number | null
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["project_access_type"]
          collaboration_style?: string
          company_id: string
          confidentiality?: Database["public"]["Enums"]["confidentiality_type"]
          contact_email: string
          contact_name: string
          contact_role: string
          created_at?: string
          created_by_id: string
          deliverables: string
          detailed_description: string
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          location?: string | null
          max_students?: number
          max_teams?: number | null
          mentorship?: Database["public"]["Enums"]["mentorship_preference"]
          min_students?: number
          open_date?: string | null
          project_type: string[]
          resource_files?: string[] | null
          resource_links?: string | null
          short_summary: string
          skills_needed?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
          weekly_hours?: number | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["project_access_type"]
          collaboration_style?: string
          company_id?: string
          confidentiality?: Database["public"]["Enums"]["confidentiality_type"]
          contact_email?: string
          contact_name?: string
          contact_role?: string
          created_at?: string
          created_by_id?: string
          deliverables?: string
          detailed_description?: string
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          location?: string | null
          max_students?: number
          max_teams?: number | null
          mentorship?: Database["public"]["Enums"]["mentorship_preference"]
          min_students?: number
          open_date?: string | null
          project_type?: string[]
          resource_files?: string[] | null
          resource_links?: string | null
          short_summary?: string
          skills_needed?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_projects: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "trending_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          description: string | null
          grad_date: string | null
          interests: string[] | null
          resume_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          grad_date?: string | null
          interests?: string[] | null
          resume_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          grad_date?: string | null
          interests?: string[] | null
          resume_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          application_id: string
          id: string
          invite_status: Database["public"]["Enums"]["team_invite_status"]
          student_id: string
        }
        Insert: {
          application_id: string
          id?: string
          invite_status?: Database["public"]["Enums"]["team_invite_status"]
          student_id: string
        }
        Update: {
          application_id?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["team_invite_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          company_role: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      trending_projects: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string | null
          updated_at: string | null
          view_count: number | null
          views_last_24_hours: number | null
          views_last_7_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_application: { Args: { app_id: string }; Returns: boolean }
      can_access_design_doc: { Args: { doc_name: string }; Returns: boolean }
      can_manage_team_members: { Args: { app_id: string }; Returns: boolean }
      company_can_access_application: {
        Args: { app_id: string }
        Returns: boolean
      }
      company_can_view_student_profile: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      get_my_company_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_recently_viewed_projects: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          company_logo_url: string
          company_name: string
          project_id: string
          project_status: Database["public"]["Enums"]["project_status"]
          project_title: string
          viewed_at: string
        }[]
      }
      project_search_vector: {
        Args: { project_row: Database["public"]["Tables"]["projects"]["Row"] }
        Returns: unknown
      }
      record_project_view: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: Json
      }
      search_projects: {
        Args: {
          access_type_filter?: Database["public"]["Enums"]["project_access_type"]
          collaboration_filter?: string[]
          hours_filter?: string[]
          location_filter?: string
          max_teams_filter?: number
          project_status_filter?: Database["public"]["Enums"]["project_status"]
          search_query: string
          sort_by?: string
          team_max_filter?: number
          team_min_filter?: number
          unlimited_teams?: boolean
        }
        Returns: {
          access_type: Database["public"]["Enums"]["project_access_type"]
          collaboration_style: string
          company_id: string
          company_logo_url: string
          company_name: string
          deliverables: string
          detailed_description: string
          end_date: string
          id: string
          location: string
          max_students: number
          max_teams: number
          min_students: number
          project_type: string[]
          resource_files: string[]
          resource_links: string
          search_rank: number
          short_summary: string
          skills_needed: string[]
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          view_count: number
          weekly_hours: number
        }[]
      }
      transition_scheduled_projects: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      application_status: "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED"
      confidentiality_type: "PUBLIC" | "CONFIDENTIAL_NO_NDA" | "NDA_REQUIRED"
      industry_sector:
        | "TECHNOLOGY"
        | "HEALTHCARE"
        | "FINANCE"
        | "EDUCATION"
        | "CONSUMER_GOODS"
        | "MEDIA_ENTERTAINMENT"
        | "TRANSPORTATION"
        | "SUSTAINABILITY"
        | "GOVERNMENT"
        | "NONPROFIT"
        | "REAL_ESTATE"
        | "LEGAL"
        | "FOOD_BEVERAGE"
        | "OTHER"
      mentorship_preference: "YES" | "NO" | "OTHER"
      project_access_type: "OPEN" | "CLOSED"
      project_status:
        | "INCOMPLETE"
        | "SCHEDULED"
        | "ACCEPTING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "ARCHIVED"
      team_invite_status: "PENDING" | "ACCEPTED" | "DECLINED"
      user_role: "STUDENT" | "COMPANY"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["PENDING", "SUBMITTED", "ACCEPTED", "REJECTED"],
      confidentiality_type: ["PUBLIC", "CONFIDENTIAL_NO_NDA", "NDA_REQUIRED"],
      industry_sector: [
        "TECHNOLOGY",
        "HEALTHCARE",
        "FINANCE",
        "EDUCATION",
        "CONSUMER_GOODS",
        "MEDIA_ENTERTAINMENT",
        "TRANSPORTATION",
        "SUSTAINABILITY",
        "GOVERNMENT",
        "NONPROFIT",
        "REAL_ESTATE",
        "LEGAL",
        "FOOD_BEVERAGE",
        "OTHER",
      ],
      mentorship_preference: ["YES", "NO", "OTHER"],
      project_access_type: ["OPEN", "CLOSED"],
      project_status: [
        "INCOMPLETE",
        "SCHEDULED",
        "ACCEPTING",
        "IN_PROGRESS",
        "COMPLETED",
        "ARCHIVED",
      ],
      team_invite_status: ["PENDING", "ACCEPTED", "DECLINED"],
      user_role: ["STUDENT", "COMPANY"],
    },
  },
} as const

