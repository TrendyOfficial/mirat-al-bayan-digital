-- Create app_role enum for user roles
create type public.app_role as enum ('admin', 'editor', 'author');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create policy "User roles are viewable by everyone"
  on public.user_roles for select
  using (true);

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  slug text unique not null,
  description_en text,
  description_ar text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

create policy "Only admins and editors can manage categories"
  on public.categories for all
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor')
  );

-- Create authors table
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  bio_en text,
  bio_ar text,
  image_url text,
  social_links jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.authors enable row level security;

create policy "Authors are viewable by everyone"
  on public.authors for select
  using (true);

create policy "Only admins and editors can manage authors"
  on public.authors for all
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor')
  );

-- Create publications table
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_ar text not null,
  slug text unique not null,
  excerpt_en text,
  excerpt_ar text,
  content_en text,
  content_ar text not null,
  featured_image_url text,
  author_id uuid references public.authors(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.publications enable row level security;

create policy "Published publications are viewable by everyone"
  on public.publications for select
  using (status = 'published' or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Authors can create publications"
  on public.publications for insert
  with check (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor') or 
    public.has_role(auth.uid(), 'author')
  );

create policy "Authors can update own publications, editors can update all"
  on public.publications for update
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor') or 
    (public.has_role(auth.uid(), 'author') and created_by = auth.uid())
  );

create policy "Admins and editors can delete publications"
  on public.publications for delete
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor')
  );

-- Create tags table
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name_en text,
  name_ar text not null,
  created_at timestamptz default now()
);

alter table public.tags enable row level security;

create policy "Tags are viewable by everyone"
  on public.tags for select
  using (true);

create policy "Only admins and editors can manage tags"
  on public.tags for all
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'editor')
  );

-- Create publication_tags junction table
create table public.publication_tags (
  publication_id uuid references public.publications(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (publication_id, tag_id)
);

alter table public.publication_tags enable row level security;

create policy "Publication tags are viewable by everyone"
  on public.publication_tags for select
  using (true);

-- Create publication_views table for analytics
create table public.publication_views (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid references public.publications(id) on delete cascade not null,
  viewed_at timestamptz default now()
);

alter table public.publication_views enable row level security;

create policy "Publication views are viewable by everyone"
  on public.publication_views for select
  using (true);

create policy "Anyone can insert publication views"
  on public.publication_views for insert
  with check (true);

-- Create settings table
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;

create policy "Settings are viewable by everyone"
  on public.settings for select
  using (true);

create policy "Only admins can manage settings"
  on public.settings for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger for automatic profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_categories_updated_at
  before update on public.categories
  for each row execute function public.update_updated_at_column();

create trigger update_authors_updated_at
  before update on public.authors
  for each row execute function public.update_updated_at_column();

create trigger update_publications_updated_at
  before update on public.publications
  for each row execute function public.update_updated_at_column();

-- Insert default categories
insert into public.categories (name_en, name_ar, slug, description_en, description_ar) values
  ('Poetry', 'قصائد', 'poetry', 'Arabic poetry and verses', 'قصائد وأشعار عربية'),
  ('Critical Studies', 'دراسات نقدية', 'critical-studies', 'Literary criticism and analysis', 'نقد أدبي وتحليل'),
  ('History of Arabic Language', 'تاريخ اللغة العربية', 'language-history', 'History and evolution of Arabic', 'تاريخ وتطور اللغة العربية'),
  ('Stories & Novels', 'روايات وقصص', 'stories-novels', 'Short stories and novels', 'قصص قصيرة وروايات'),
  ('Cultural News', 'أخبار ثقافية', 'cultural-news', 'Literary and cultural news', 'أخبار أدبية وثقافية'),
  ('Thoughts & Essays', 'خواطر ومقالات', 'thoughts-essays', 'Personal reflections and essays', 'تأملات ومقالات شخصية');

-- Insert default site settings
insert into public.settings (key, value) values
  ('site_title_en', '"Miratl Bayan"'::jsonb),
  ('site_title_ar', '"مرآة البيان"'::jsonb),
  ('site_description_en', '"A modern Arabic literature magazine"'::jsonb),
  ('site_description_ar', '"مجلة أدبية عربية حديثة"'::jsonb),
  ('social_links', '{"facebook": "", "twitter": "", "instagram": ""}'::jsonb);

-- Enable realtime for publication_views
alter publication supabase_realtime add table public.publication_views;