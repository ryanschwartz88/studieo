-- Sample Data Seed Script for Studieo
-- This creates realistic sample data for development and testing
-- Safe to run in development environments

-- ============================================
-- 1. CREATE NEW COMPANIES
-- ============================================

INSERT INTO companies (name, domain, website, sector, description, location, logo_url) VALUES
-- Tech Companies
('Acme AI', 'acmeai.com', 'https://acmeai.com', 'TECHNOLOGY', 
 'Leading AI research company building the next generation of machine learning tools. We work with top universities to solve real-world problems.',
 'San Francisco, CA', NULL),
 
('CloudScale Systems', 'cloudscale.io', 'https://cloudscale.io', 'TECHNOLOGY',
 'Enterprise cloud infrastructure provider helping companies scale their operations. We value innovation and collaboration with student teams.',
 'Seattle, WA', NULL),
 
('DataViz Analytics', 'dataviz.com', 'https://dataviz.com', 'TECHNOLOGY',
 'Data visualization and analytics platform. We turn complex data into actionable insights for businesses worldwide.',
 'New York, NY', NULL),

-- Healthcare
('MedTech Innovations', 'medtech.io', 'https://medtech.io', 'HEALTHCARE',
 'Healthcare technology startup developing patient monitoring solutions. We partner with students to bring fresh perspectives to healthcare.',
 'Boston, MA', NULL),
 
('HealthFlow', 'healthflow.com', 'https://healthflow.com', 'HEALTHCARE',
 'Digital health platform connecting patients with providers. Our mission is to make healthcare more accessible and efficient.',
 'Austin, TX', NULL),

-- Finance
('FinTech Solutions', 'fintechsolutions.com', 'https://fintechsolutions.com', 'FINANCE',
 'Financial technology company building the next generation of banking tools. We work with students to innovate in fintech.',
 'Chicago, IL', NULL),
 
('CryptoVault', 'cryptovault.io', 'https://cryptovault.io', 'FINANCE',
 'Blockchain and cryptocurrency security platform. We help institutions secure their digital assets with cutting-edge technology.',
 'San Francisco, CA', NULL),

-- Education
('EduTech Labs', 'edutechlabs.com', 'https://edutechlabs.com', 'EDUCATION',
 'Educational technology company creating tools for online learning. We believe in empowering students through technology.',
 'Cambridge, MA', NULL),

-- Sustainability
('GreenTech Energy', 'greentech.energy', 'https://greentech.energy', 'SUSTAINABILITY',
 'Renewable energy solutions provider. We develop solar and wind energy systems to combat climate change.',
 'Portland, OR', NULL),
 
('EcoSolutions', 'ecosolutions.io', 'https://ecosolutions.io', 'SUSTAINABILITY',
 'Environmental consulting firm helping companies reduce their carbon footprint. We work with students passionate about sustainability.',
 'Boulder, CO', NULL)

ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- 2. CREATE COMPANY USERS
-- ============================================

-- Get company IDs for reference
DO $$
DECLARE
  acme_ai_id uuid;
  cloudscale_id uuid;
  dataviz_id uuid;
  medtech_id uuid;
  healthflow_id uuid;
  fintech_id uuid;
  cryptovault_id uuid;
  edutech_id uuid;
  greentech_id uuid;
  ecosolutions_id uuid;
BEGIN
  SELECT id INTO acme_ai_id FROM companies WHERE domain = 'acmeai.com';
  SELECT id INTO cloudscale_id FROM companies WHERE domain = 'cloudscale.io';
  SELECT id INTO dataviz_id FROM companies WHERE domain = 'dataviz.com';
  SELECT id INTO medtech_id FROM companies WHERE domain = 'medtech.io';
  SELECT id INTO healthflow_id FROM companies WHERE domain = 'healthflow.com';
  SELECT id INTO fintech_id FROM companies WHERE domain = 'fintechsolutions.com';
  SELECT id INTO cryptovault_id FROM companies WHERE domain = 'cryptovault.io';
  SELECT id INTO edutech_id FROM companies WHERE domain = 'edutechlabs.com';
  SELECT id INTO greentech_id FROM companies WHERE domain = 'greentech.energy';
  SELECT id INTO ecosolutions_id FROM companies WHERE domain = 'ecosolutions.io';

  -- Create auth users and link to companies
  -- Note: In production, these would be created via Supabase Auth
  -- For seed data, we'll create the public.users records
  -- You'll need to create auth users separately or use Supabase dashboard
  
  -- For now, we'll just prepare the data structure
  -- Actual auth user creation should be done via Supabase Auth API
END $$;

-- ============================================
-- 3. CREATE STUDENT USERS (with profiles)
-- ============================================

-- Note: These require auth.users to exist first
-- For seed data, we'll create placeholder structure
-- In practice, create auth users via Supabase Auth, then link to public.users

-- ============================================
-- 4. CREATE PROJECTS FOR NEW COMPANIES
-- ============================================

DO $$
DECLARE
  acme_ai_id uuid;
  cloudscale_id uuid;
  dataviz_id uuid;
  medtech_id uuid;
  healthflow_id uuid;
  fintech_id uuid;
  cryptovault_id uuid;
  edutech_id uuid;
  greentech_id uuid;
  ecosolutions_id uuid;
  nura_id uuid;
  nura_user_id uuid;
  project_id uuid;
BEGIN
  -- Get company IDs
  SELECT id INTO acme_ai_id FROM companies WHERE domain = 'acmeai.com';
  SELECT id INTO cloudscale_id FROM companies WHERE domain = 'cloudscale.io';
  SELECT id INTO dataviz_id FROM companies WHERE domain = 'dataviz.com';
  SELECT id INTO medtech_id FROM companies WHERE domain = 'medtech.io';
  SELECT id INTO healthflow_id FROM companies WHERE domain = 'healthflow.com';
  SELECT id INTO fintech_id FROM companies WHERE domain = 'fintechsolutions.com';
  SELECT id INTO cryptovault_id FROM companies WHERE domain = 'cryptovault.io';
  SELECT id INTO edutech_id FROM companies WHERE domain = 'edutechlabs.com';
  SELECT id INTO greentech_id FROM companies WHERE domain = 'greentech.energy';
  SELECT id INTO ecosolutions_id FROM companies WHERE domain = 'ecosolutions.io';
  SELECT id INTO nura_id FROM companies WHERE domain = 'nuralabs.io';
  SELECT id INTO nura_user_id FROM users WHERE email = 'ryan.schwartz@nuralabs.io';

  -- If no existing user, we'll need to create one or use a placeholder
  -- For now, use existing Nura user as creator for all projects

  -- ACME AI Projects
  IF acme_ai_id IS NOT NULL AND nura_user_id IS NOT NULL THEN
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      acme_ai_id, nura_user_id, 'ACCEPTING',
      'AI-Powered Customer Support Chatbot',
      'Build an intelligent chatbot using LLMs to handle customer inquiries with 95% accuracy.',
      'We need a team to develop a customer support chatbot that can understand context, maintain conversation flow, and escalate complex issues to human agents. The system should integrate with our existing CRM and support ticket system. Key requirements include natural language understanding, sentiment analysis, and multi-language support.',
      ARRAY['Software Development', 'AI/ML'],
      ARRAY['Python', 'Machine Learning', 'NLP', 'API Development', 'React'],
      '1. Fully functional chatbot with web interface\n2. Integration with CRM system\n3. Analytics dashboard showing conversation metrics\n4. Documentation and deployment guide\n5. Test suite with 80%+ coverage',
      2, 4, 15, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '4 months',
      'OPEN', 'Sarah Chen', 'Product Manager', 'sarah.chen@acmeai.com',
      'YES', 'PUBLIC', 0
    ),
    (
      acme_ai_id, nura_user_id, 'ACCEPTING',
      'Computer Vision for Quality Control',
      'Develop a computer vision system to detect defects in manufacturing using deep learning.',
      'Create an automated quality control system that uses computer vision to identify defects in manufactured products. The system should process images in real-time, classify defects, and generate reports. We''re looking for a solution that can be integrated into existing production lines.',
      ARRAY['AI/ML', 'Research'],
      ARRAY['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow', 'OpenCV'],
      '1. Trained model with 95%+ accuracy\n2. Real-time inference pipeline\n3. Web dashboard for monitoring\n4. Integration API\n5. Research paper documenting approach',
      3, 5, 20, 'Hybrid', 'San Francisco, CA',
      CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '5 months',
      'CLOSED', 'Michael Park', 'ML Engineer', 'michael.park@acmeai.com',
      'YES', 'CONFIDENTIAL_NO_NDA', 0
    );

    -- CloudScale Systems Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      cloudscale_id, nura_user_id, 'ACCEPTING',
      'Cloud Infrastructure Monitoring Dashboard',
      'Build a real-time monitoring dashboard for cloud infrastructure with alerting and analytics.',
      'Develop a comprehensive monitoring dashboard that tracks server performance, resource usage, and system health across our cloud infrastructure. The dashboard should provide real-time metrics, historical data visualization, and automated alerting for critical issues.',
      ARRAY['Software Development', 'DevOps'],
      ARRAY['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      '1. Real-time monitoring dashboard\n2. Alerting system with email/Slack integration\n3. Historical data visualization\n4. User authentication and role-based access\n5. Deployment documentation',
      2, 3, 12, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '3 months',
      'OPEN', 'David Kim', 'DevOps Lead', 'david.kim@cloudscale.io',
      'YES', 'PUBLIC', 0
    );

    -- DataViz Analytics Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      dataviz_id, nura_user_id, 'ACCEPTING',
      'Interactive Data Visualization Library',
      'Create a reusable React component library for creating interactive data visualizations.',
      'Build a comprehensive React component library for data visualization that includes charts, graphs, and interactive dashboards. The library should be well-documented, accessible, and performant. Focus on creating components that are easy to use and customizable.',
      ARRAY['Software Development', 'Design'],
      ARRAY['React', 'TypeScript', 'D3.js', 'Storybook', 'CSS'],
      '1. Component library with 10+ chart types\n2. Storybook documentation\n3. TypeScript definitions\n4. Unit tests\n5. Example applications',
      2, 4, 10, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '3 months',
      'OPEN', 'Emily Rodriguez', 'Frontend Lead', 'emily.rodriguez@dataviz.com',
      'YES', 'PUBLIC', 0
    );

    -- MedTech Innovations Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count, max_teams
    ) VALUES
    (
      medtech_id, nura_user_id, 'ACCEPTING',
      'Patient Health Monitoring Mobile App',
      'Develop a mobile app for patients to track vital signs and share data with healthcare providers.',
      'Create a mobile application (iOS and Android) that allows patients to log vital signs, medication adherence, and symptoms. The app should sync data with healthcare provider systems and provide insights to both patients and doctors. Must comply with HIPAA regulations.',
      ARRAY['Mobile Development', 'Healthcare'],
      ARRAY['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'HIPAA Compliance'],
      '1. Cross-platform mobile app\n2. Secure data sync with backend\n3. Patient dashboard\n4. Provider portal integration\n5. HIPAA compliance documentation',
      3, 5, 18, 'Hybrid', 'Boston, MA',
      CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '6 months',
      'CLOSED', 'Dr. James Wilson', 'Chief Medical Officer', 'james.wilson@medtech.io',
      'YES', 'CONFIDENTIAL_NO_NDA', 0, 2
    );

    -- HealthFlow Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      healthflow_id, nura_user_id, 'ACCEPTING',
      'Telemedicine Platform Enhancement',
      'Enhance our telemedicine platform with AI-powered symptom analysis and appointment scheduling.',
      'Improve our existing telemedicine platform by adding AI-powered symptom analysis, intelligent appointment scheduling, and better patient-provider matching. The system should reduce wait times and improve patient outcomes.',
      ARRAY['Software Development', 'AI/ML'],
      ARRAY['Python', 'FastAPI', 'React', 'Machine Learning', 'PostgreSQL'],
      '1. AI symptom analysis module\n2. Smart scheduling algorithm\n3. Enhanced matching system\n4. Performance improvements\n5. User testing results',
      2, 4, 15, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '4 months',
      'OPEN', 'Lisa Thompson', 'Product Manager', 'lisa.thompson@healthflow.com',
      'YES', 'PUBLIC', 0
    );

    -- FinTech Solutions Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      fintech_id, nura_user_id, 'ACCEPTING',
      'Fraud Detection System',
      'Build a machine learning system to detect fraudulent transactions in real-time.',
      'Develop a real-time fraud detection system that analyzes transaction patterns and flags suspicious activity. The system should integrate with our payment processing pipeline and provide low false positive rates while catching actual fraud.',
      ARRAY['AI/ML', 'Software Development'],
      ARRAY['Python', 'Machine Learning', 'Kafka', 'PostgreSQL', 'Docker'],
      '1. Trained fraud detection model\n2. Real-time processing pipeline\n3. Alerting system\n4. Performance metrics dashboard\n5. Model documentation',
      3, 4, 20, 'Hybrid', 'Chicago, IL',
      CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '5 months',
      'CLOSED', 'Robert Martinez', 'Security Engineer', 'robert.martinez@fintechsolutions.com',
      'NO', 'CONFIDENTIAL_NO_NDA', 0
    );

    -- CryptoVault Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      cryptovault_id, nura_user_id, 'ACCEPTING',
      'Blockchain Transaction Analyzer',
      'Create a tool to analyze blockchain transactions and detect suspicious patterns.',
      'Build a comprehensive blockchain analysis tool that tracks transactions, identifies patterns, and flags potentially suspicious activity. The tool should support multiple blockchains and provide visualizations of transaction flows.',
      ARRAY['Blockchain', 'Software Development'],
      ARRAY['Python', 'Blockchain', 'Web3', 'React', 'PostgreSQL'],
      '1. Multi-chain transaction analyzer\n2. Pattern detection algorithms\n3. Visualization dashboard\n4. API for integration\n5. Documentation',
      2, 3, 12, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '4 months',
      'OPEN', 'Alex Chen', 'Blockchain Engineer', 'alex.chen@cryptovault.io',
      'YES', 'PUBLIC', 0
    );

    -- EduTech Labs Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      edutech_id, nura_user_id, 'ACCEPTING',
      'Adaptive Learning Platform',
      'Develop an AI-powered adaptive learning system that personalizes content for each student.',
      'Create a learning platform that uses AI to adapt course content based on student performance, learning style, and pace. The system should provide personalized recommendations and track learning outcomes.',
      ARRAY['AI/ML', 'Software Development', 'Education'],
      ARRAY['Python', 'Machine Learning', 'React', 'PostgreSQL', 'Educational Technology'],
      '1. Adaptive learning algorithm\n2. Student dashboard\n3. Content recommendation system\n4. Analytics and reporting\n5. Pilot study results',
      3, 5, 16, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '6 months',
      'OPEN', 'Dr. Maria Garcia', 'Head of Product', 'maria.garcia@edutechlabs.com',
      'YES', 'PUBLIC', 0
    );

    -- GreenTech Energy Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      greentech_id, nura_user_id, 'ACCEPTING',
      'Solar Energy Optimization System',
      'Build a system to optimize solar panel placement and energy generation using IoT sensors.',
      'Develop an IoT-based system that monitors solar panel performance, weather conditions, and energy generation. Use this data to optimize panel placement and predict energy output. The system should include a dashboard for monitoring and analytics.',
      ARRAY['IoT', 'Software Development', 'Sustainability'],
      ARRAY['Python', 'IoT', 'React', 'PostgreSQL', 'Data Analysis'],
      '1. IoT sensor integration\n2. Data collection and storage\n3. Optimization algorithms\n4. Monitoring dashboard\n5. Performance analysis report',
      2, 4, 14, 'Hybrid', 'Portland, OR',
      CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '4 months',
      'OPEN', 'Jennifer Lee', 'Engineering Manager', 'jennifer.lee@greentech.energy',
      'YES', 'PUBLIC', 0
    );

    -- EcoSolutions Projects
    INSERT INTO projects (
      company_id, created_by_id, status, title, short_summary, detailed_description,
      project_type, skills_needed, deliverables, min_students, max_students,
      weekly_hours, collaboration_style, location, start_date, end_date,
      access_type, contact_name, contact_role, contact_email, mentorship,
      confidentiality, view_count
    ) VALUES
    (
      ecosolutions_id, nura_user_id, 'ACCEPTING',
      'Carbon Footprint Calculator',
      'Create a web application that calculates and tracks carbon footprint for individuals and businesses.',
      'Build a comprehensive carbon footprint calculator that allows users to input various activities and get accurate carbon footprint estimates. Include features for tracking over time, setting reduction goals, and comparing with industry benchmarks.',
      ARRAY['Software Development', 'Sustainability'],
      ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Data Visualization'],
      '1. Carbon calculator web app\n2. User accounts and tracking\n3. Goal setting and progress tracking\n4. Industry benchmarks\n5. Educational content',
      2, 3, 10, 'Remote', 'Remote',
      CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '3 months',
      'OPEN', 'Tom Anderson', 'Product Lead', 'tom.anderson@ecosolutions.io',
      'YES', 'PUBLIC', 0
    );

  END IF;
END $$;

-- ============================================
-- 5. ADD SOME PROJECT VIEWS (Student views only)
-- ============================================

-- Get student user ID and project IDs
DO $$
DECLARE
  student_id uuid;
  project_ids uuid[];
  project_id uuid;
  i integer;
BEGIN
  -- Get existing student user
  SELECT id INTO student_id FROM users WHERE role = 'STUDENT' LIMIT 1;
  
  -- Get all ACCEPTING projects
  SELECT ARRAY_AGG(id) INTO project_ids 
  FROM projects 
  WHERE status = 'ACCEPTING';
  
  -- Add views to random projects (simulating student browsing)
  IF student_id IS NOT NULL AND project_ids IS NOT NULL THEN
    -- Add 2-5 views to each project (simulating multiple students)
    FOR project_id IN SELECT unnest(project_ids) LOOP
      -- Simulate 3-8 student views per project
      FOR i IN 1..(3 + floor(random() * 6)::int) LOOP
        INSERT INTO project_views (project_id, user_id, viewed_at)
        VALUES (
          project_id,
          student_id,
          CURRENT_TIMESTAMP - (random() * INTERVAL '30 days')
        )
        ON CONFLICT (project_id, user_id) DO NOTHING;
      END LOOP;
    END LOOP;
    
    -- Update view_count on projects
    UPDATE projects p
    SET view_count = (
      SELECT COUNT(DISTINCT user_id)
      FROM project_views pv
      WHERE pv.project_id = p.id
    )
    WHERE p.status = 'ACCEPTING';
  END IF;
END $$;

-- ============================================
-- 6. ADD SOME APPLICATIONS (Optional)
-- ============================================

-- Note: Applications require team_lead_id (student user)
-- We'll skip this for now since we need actual student auth users
-- You can add applications later via the UI or API

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  company_count integer;
  project_count integer;
  view_count integer;
BEGIN
  SELECT COUNT(*) INTO company_count FROM companies;
  SELECT COUNT(*) INTO project_count FROM projects WHERE status = 'ACCEPTING';
  SELECT COUNT(*) INTO view_count FROM project_views;
  
  RAISE NOTICE 'Seed data created:';
  RAISE NOTICE '  Companies: %', company_count;
  RAISE NOTICE '  Active Projects: %', project_count;
  RAISE NOTICE '  Project Views: %', view_count;
END $$;

