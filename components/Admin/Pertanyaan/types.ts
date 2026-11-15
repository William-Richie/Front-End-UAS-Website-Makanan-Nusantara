export interface PertanyaanItem {
  id: number;
  nama: string;
  email: string;
  pertanyaan: string;
  dibaca: boolean;
  created_at: string;
  user_id?: string | null;
  jawaban?: string | null;
  dijawab_at?: string | null;
}
