import bcrypt from "bcryptjs";
import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting database seeding with expanded test dataset...");

  // 1. Clean existing records idempotently
  await prisma.taskActivityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = "Password123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 2. Create Users (1 Admin, 2 PMs, 6 Developers)
  console.log("Creating 9 core team users...");
  const admin = await prisma.user.create({
    data: {
      name: "Rajesh Verma",
      email: "admin@velozity.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: "Neha Sharma (PM)",
      email: "neha.pm@velozity.com",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: "Rohan Kulkarni (PM)",
      email: "rohan.pm@velozity.com",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: "Ravi Kumar",
      email: "ravi.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "arjun.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: "Kavya Reddy",
      email: "kavya.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev5 = await prisma.user.create({
    data: {
      name: "Siddharth Nair",
      email: "siddharth.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev6 = await prisma.user.create({
    data: {
      name: "Ananya Iyer",
      email: "ananya.dev@velozity.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  // 3. Create Clients (5 Indian Enterprise Accounts)
  console.log("Creating 5 enterprise clients...");
  const client1 = await prisma.client.create({
    data: {
      name: "Tata Consultancy Services",
      email: "enterprise@tcs.in",
      company: "Tata Group Innovations",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "HDFC Digital Labs",
      email: "fintech@hdfclabs.in",
      company: "HDFC Financial Services",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Jio Digital Platforms",
      email: "connect@jiodigital.in",
      company: "Reliance Jio Infocomm",
    },
  });

  const client4 = await prisma.client.create({
    data: {
      name: "Infosys Cloud Solutions",
      email: "cloud@infosys.in",
      company: "Infosys Limited",
    },
  });

  const client5 = await prisma.client.create({
    data: {
      name: "Wipro Engineering Services",
      email: "digital@wipro.in",
      company: "Wipro Technologies",
    },
  });

  // 4. Create Projects (5 projects distributed across PM1 and PM2)
  console.log("Creating 5 client projects...");
  const project1 = await prisma.project.create({
    data: {
      name: "Enterprise Mobile Banking App",
      description: "Next-generation secure mobile banking application with biometrics and real-time ledger.",
      clientId: client1.id,
      createdById: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Cloud Infrastructure & Security Hardening",
      description: "Multi-region Kubernetes deployment, zero-trust network policies, and SOC2 compliance audit.",
      clientId: client2.id,
      createdById: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Real-Time AI Analytics Engine",
      description: "High-throughput telemetry ingestion and real-time LLM inference stream pipeline.",
      clientId: client3.id,
      createdById: pm2.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: "Supply Chain IoT Tracking Network",
      description: "Asset tracking telematics, BLE sensor mesh, and cold-chain temperature thresholds.",
      clientId: client4.id,
      createdById: pm2.id,
    },
  });

  const project5 = await prisma.project.create({
    data: {
      name: "Healthcare Patient Portal & Telemedicine",
      description: "HIPAA-compliant video consults, encrypted EHR integration, and digital e-prescriptions.",
      clientId: client5.id,
      createdById: pm1.id,
    },
  });

  // Helper date generators
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);
  const daysFuture = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000);
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
  const minsAgo = (m: number) => new Date(now - m * 60 * 1000);

  // 5. Create Tasks (32+ tasks with assigned, unassigned, overdue, and due-this-week variations)
  console.log("Creating tasks across all projects with unassigned and overdue tickets...");

  // --- Project 1: Mobile Banking (PM Neha) ---
  const t1_1 = await prisma.task.create({
    data: {
      title: "Fix biometric authentication timeout on iOS",
      description: "FaceID fails intermittently on iOS 17 when resuming from suspended state.",
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysAgo(3),
      isOverdue: true, // Overdue task #1
    },
  });

  const t1_2 = await prisma.task.create({
    data: {
      title: "Implement OAuth2 PKCE login flow",
      description: "Transition mobile login from legacy resource owner flow to PKCE standard.",
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(2),
      isOverdue: false,
    },
  });

  const t1_3 = await prisma.task.create({
    data: {
      title: "Build transactional push notifications",
      description: "Deliver instant payment receipts via Apple APNs and Google FCM.",
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(5),
      isOverdue: false,
    },
  });

  const t1_4 = await prisma.task.create({
    data: {
      title: "Design card freeze / unfreeze toggle UI",
      description: "Instant card disable switch in account settings.",
      projectId: project1.id,
      assignedToId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: daysAgo(1),
      isOverdue: false,
    },
  });

  const t1_5 = await prisma.task.create({
    data: {
      title: "Integrate Plaid account verification",
      description: "Instant bank account link for external ACH transfers.",
      projectId: project1.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(4),
      isOverdue: false,
    },
  });

  const t1_6 = await prisma.task.create({
    data: {
      title: "Write automated end-to-end transfer tests",
      description: "Cover debit, credit, and insufficient fund scenarios using Playwright.",
      projectId: project1.id,
      assignedToId: dev5.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(7),
      isOverdue: false,
    },
  });

  // UNASSIGNED TASK for Project 1 (Ready for testing Admin/PM assignment)
  const t1_7 = await prisma.task.create({
    data: {
      title: "Conduct third-party mobile penetration audit",
      description: "External security firm OWASP Mobile Top 10 compliance audit and code review.",
      projectId: project1.id,
      assignedToId: null, // Unassigned
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFuture(6),
      isOverdue: false,
    },
  });

  // --- Project 2: Cloud Infrastructure (PM Neha) ---
  const t2_1 = await prisma.task.create({
    data: {
      title: "Remediate open SSL certificate vulnerabilities",
      description: "Rotate edge ingress certificates and enforce TLS 1.3 only.",
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: daysAgo(5),
      isOverdue: true, // Overdue task #2
    },
  });

  const t2_2 = await prisma.task.create({
    data: {
      title: "Setup PostgreSQL replication and failover",
      description: "Provision multi-AZ read replicas with automated failover via PgBouncer.",
      projectId: project2.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(3),
      isOverdue: false,
    },
  });

  const t2_3 = await prisma.task.create({
    data: {
      title: "Configure AWS WAF rate-limiting rules",
      description: "Protect auth endpoints from brute-force token enumeration attacks.",
      projectId: project2.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(2),
      isOverdue: false,
    },
  });

  const t2_4 = await prisma.task.create({
    data: {
      title: "Implement Prometheus & Grafana alerting",
      description: "Real-time Slack alerts on high CPU, memory leaks, and 5xx error spikes.",
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(1),
      isOverdue: false,
    },
  });

  const t2_5 = await prisma.task.create({
    data: {
      title: "Audit IAM user permissions and rotate access keys",
      description: "Enforce least-privilege principles and revoke inactive API credentials.",
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(4),
      isOverdue: false,
    },
  });

  const t2_6 = await prisma.task.create({
    data: {
      title: "Containerize microservices with distroless images",
      description: "Strip shell and package managers from runtime images to reduce attack surface.",
      projectId: project2.id,
      assignedToId: dev6.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: daysFuture(6),
      isOverdue: false,
    },
  });

  // UNASSIGNED TASK for Project 2
  const t2_7 = await prisma.task.create({
    data: {
      title: "Benchmark multi-region disaster recovery RTO and RPO",
      description: "Simulate primary availability zone outage and verify failover completes under 60 seconds.",
      projectId: project2.id,
      assignedToId: null, // Unassigned
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(8),
      isOverdue: false,
    },
  });

  // --- Project 3: AI Analytics Engine (PM Rohan) ---
  const t3_1 = await prisma.task.create({
    data: {
      title: "Build WebSocket event consumer stream",
      description: "Stream live telemetry points into Redis Pub/Sub buffer.",
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFuture(1),
      isOverdue: false,
    },
  });

  const t3_2 = await prisma.task.create({
    data: {
      title: "Implement vector similarity embedding index",
      description: "Use pgvector to index and query customer intent vectors.",
      projectId: project3.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(2),
      isOverdue: false,
    },
  });

  const t3_3 = await prisma.task.create({
    data: {
      title: "Optimize token streaming chunk latency",
      description: "Reduce time-to-first-token below 200ms using HTTP chunked transfer.",
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(1),
      isOverdue: false,
    },
  });

  const t3_4 = await prisma.task.create({
    data: {
      title: "Create real-time query rate dashboard widget",
      description: "Interactive chart showing tokens per second across tenants.",
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(4),
      isOverdue: false,
    },
  });

  const t3_5 = await prisma.task.create({
    data: {
      title: "Implement cost tracking per tenant",
      description: "Track prompt/completion token consumption in PostgreSQL.",
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(3),
      isOverdue: false,
    },
  });

  const t3_6 = await prisma.task.create({
    data: {
      title: "Write documentation for internal inference SDK",
      description: "Document Node.js client methods and error handling conventions.",
      projectId: project3.id,
      assignedToId: dev5.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: daysAgo(3),
      isOverdue: false,
    },
  });

  // UNASSIGNED TASK for Project 3
  const t3_7 = await prisma.task.create({
    data: {
      title: "Implement semantic response caching with Redis",
      description: "Cache frequent embeddings and vector lookup results to drop downstream LLM costs by 35%.",
      projectId: project3.id,
      assignedToId: null, // Unassigned
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(5),
      isOverdue: false,
    },
  });

  // --- Project 4: Supply Chain IoT Network (PM Rohan) ---
  const t4_1 = await prisma.task.create({
    data: {
      title: "Configure MQTT broker with TLS mutual authentication",
      description: "Set up EMQX broker cluster with X.509 device client certificate validation.",
      projectId: project4.id,
      assignedToId: dev5.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFuture(2),
      isOverdue: false,
    },
  });

  const t4_2 = await prisma.task.create({
    data: {
      title: "Build geofencing alert notification pipeline",
      description: "Detect when cargo containers depart authorized warehouse delivery corridors.",
      projectId: project4.id,
      assignedToId: dev6.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(4),
      isOverdue: false,
    },
  });

  const t4_3 = await prisma.task.create({
    data: {
      title: "Calibrate cold-chain temperature threshold alerts",
      description: "Send immediate alerts if vaccine storage temperature exceeds -20 deg Celsius.",
      projectId: project4.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(1),
      isOverdue: false,
    },
  });

  const t4_4 = await prisma.task.create({
    data: {
      title: "Ingest CAN-bus vehicle telemetry stream",
      description: "Parse OBD-II sensor codes for engine diagnostics and driver braking habits.",
      projectId: project4.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(2),
      isOverdue: false,
    },
  });

  const t4_5 = await prisma.task.create({
    data: {
      title: "Battery drain profiling on edge GPS beacons",
      description: "Benchmark sleep-mode power consumption to ensure minimum 180-day field lifespan.",
      projectId: project4.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(2),
      isOverdue: true, // Overdue task #3
    },
  });

  // UNASSIGNED TASK for Project 4
  const t4_6 = await prisma.task.create({
    data: {
      title: "Design hardware firmware OTA update scheduler",
      description: "Staged batch deployments of encrypted binary firmware to IoT gateways in field.",
      projectId: project4.id,
      assignedToId: null, // Unassigned
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(9),
      isOverdue: false,
    },
  });

  // --- Project 5: Healthcare Telemedicine (PM Neha) ---
  const t5_1 = await prisma.task.create({
    data: {
      title: "WebRTC peer-to-peer encrypted video consults",
      description: "Build low-latency end-to-end encrypted video streaming with fallback TURN relay.",
      projectId: project5.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFuture(3),
      isOverdue: false,
    },
  });

  const t5_2 = await prisma.task.create({
    data: {
      title: "FHIR compliant health record export module",
      description: "Serialize clinical observations and lab results into HL7/FHIR v4 JSON structures.",
      projectId: project5.id,
      assignedToId: dev5.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(5),
      isOverdue: false,
    },
  });

  const t5_3 = await prisma.task.create({
    data: {
      title: "Automated SMS appointment reminder scheduler",
      description: "Send 24-hour and 2-hour pre-appointment reminders via Twilio SMS gateway.",
      projectId: project5.id,
      assignedToId: dev6.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(3),
      isOverdue: false,
    },
  });

  const t5_4 = await prisma.task.create({
    data: {
      title: "Audit HIPAA access log retention compliance",
      description: "Ensure immutable audit log write stream for every patient medical chart access.",
      projectId: project5.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFuture(2),
      isOverdue: false,
    },
  });

  const t5_5 = await prisma.task.create({
    data: {
      title: "Legacy radiology DICOM image viewer integration",
      description: "Integrate Cornerstone.js web viewer for multi-slice CT and MRI scan visualization.",
      projectId: project5.id,
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(4),
      isOverdue: true, // Overdue task #4
    },
  });

  // UNASSIGNED TASK for Project 5
  const t5_6 = await prisma.task.create({
    data: {
      title: "Prescription digital cryptographic signature validation",
      description: "Implement Aadhaar eSign / PKI-based doctor signature verification on prescription PDFs.",
      projectId: project5.id,
      assignedToId: null, // Unassigned
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFuture(6),
      isOverdue: false,
    },
  });

  // 6. Create Pre-Existing Activity Logs (Audit Trail)
  console.log("Populating historical activity feed...");
  await prisma.taskActivityLog.createMany({
    data: [
      {
        taskId: t1_1.id,
        projectId: project1.id,
        userId: dev1.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
        message: 'Ravi Kumar moved Task "Fix biometric authentication timeout on iOS" from To Do → In Progress',
        createdAt: hoursAgo(5),
      },
      {
        taskId: t1_2.id,
        projectId: project1.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: 'Ravi Kumar moved Task "Implement OAuth2 PKCE login flow" from In Progress → In Review',
        createdAt: minsAgo(18),
      },
      {
        taskId: t1_4.id,
        projectId: project1.id,
        userId: dev3.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        message: 'Arjun Mehta moved Task "Design card freeze / unfreeze toggle UI" from In Review → Done',
        createdAt: hoursAgo(12),
      },
      {
        taskId: t2_2.id,
        projectId: project2.id,
        userId: dev2.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: 'Priya Sharma moved Task "Setup PostgreSQL replication and failover" from In Progress → In Review',
        createdAt: minsAgo(45),
      },
      {
        taskId: t2_3.id,
        projectId: project2.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        message: 'Ravi Kumar moved Task "Configure AWS WAF rate-limiting rules" from In Review → Done',
        createdAt: hoursAgo(22),
      },
      {
        taskId: t3_1.id,
        projectId: project3.id,
        userId: dev4.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
        message: 'Kavya Reddy moved Task "Build WebSocket event consumer stream" from To Do → In Progress',
        createdAt: hoursAgo(2),
      },
      {
        taskId: t3_2.id,
        projectId: project3.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: 'Ravi Kumar moved Task "Implement vector similarity embedding index" from In Progress → In Review',
        createdAt: minsAgo(120),
      },
      {
        taskId: t3_3.id,
        projectId: project3.id,
        userId: dev2.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        message: 'Priya Sharma moved Task "Optimize token streaming chunk latency" from In Review → Done',
        createdAt: hoursAgo(18),
      },
      {
        taskId: t4_3.id,
        projectId: project4.id,
        userId: dev4.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: 'Kavya Reddy moved Task "Calibrate cold-chain temperature threshold alerts" from In Progress → In Review',
        createdAt: minsAgo(75),
      },
      {
        taskId: t5_4.id,
        projectId: project5.id,
        userId: dev3.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: 'Arjun Mehta moved Task "Audit HIPAA access log retention compliance" from In Progress → In Review',
        createdAt: hoursAgo(4),
      },
      {
        taskId: t1_1.id,
        projectId: project1.id,
        userId: pm1.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.TODO,
        message: 'Task "Fix biometric authentication timeout on iOS" was auto-flagged as Overdue by background scheduler',
        createdAt: hoursAgo(24),
      },
      {
        taskId: t2_1.id,
        projectId: project2.id,
        userId: pm1.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.TODO,
        message: 'Task "Remediate open SSL certificate vulnerabilities" was auto-flagged as Overdue by background scheduler',
        createdAt: hoursAgo(48),
      },
      {
        taskId: t4_5.id,
        projectId: project4.id,
        userId: pm2.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.TODO,
        message: 'Task "Battery drain profiling on edge GPS beacons" was auto-flagged as Overdue by background scheduler',
        createdAt: hoursAgo(16),
      },
      {
        taskId: t5_5.id,
        projectId: project5.id,
        userId: pm1.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.TODO,
        message: 'Task "Legacy radiology DICOM image viewer integration" was auto-flagged as Overdue by background scheduler',
        createdAt: hoursAgo(36),
      },
      {
        taskId: t1_7.id,
        projectId: project1.id,
        userId: admin.id,
        fromStatus: null,
        toStatus: null,
        message: 'Rajesh Verma created unassigned deliverable "Conduct third-party mobile penetration audit"',
        createdAt: hoursAgo(10),
      },
      {
        taskId: t4_6.id,
        projectId: project4.id,
        userId: pm2.id,
        fromStatus: null,
        toStatus: null,
        message: 'Rohan Kulkarni (PM) created unassigned deliverable "Design hardware firmware OTA update scheduler"',
        createdAt: hoursAgo(8),
      },
    ],
  });

  // 7. Seed sample unread notifications
  console.log("Creating seed notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        type: NotificationType.TASK_ASSIGNED,
        message: 'You were assigned to task "Fix biometric authentication timeout on iOS"',
        relatedTaskId: t1_1.id,
        isRead: false,
        createdAt: hoursAgo(6),
      },
      {
        userId: dev5.id,
        type: NotificationType.TASK_ASSIGNED,
        message: 'You were assigned to task "Configure MQTT broker with TLS mutual authentication"',
        relatedTaskId: t4_1.id,
        isRead: false,
        createdAt: hoursAgo(5),
      },
      {
        userId: dev6.id,
        type: NotificationType.TASK_ASSIGNED,
        message: 'You were assigned to task "Build geofencing alert notification pipeline"',
        relatedTaskId: t4_2.id,
        isRead: false,
        createdAt: hoursAgo(4),
      },
      {
        userId: pm1.id,
        type: NotificationType.TASK_MOVED_TO_REVIEW,
        message: 'Task "Implement OAuth2 PKCE login flow" has been moved to In Review by Ravi Kumar',
        relatedTaskId: t1_2.id,
        isRead: false,
        createdAt: minsAgo(18),
      },
      {
        userId: pm1.id,
        type: NotificationType.TASK_MOVED_TO_REVIEW,
        message: 'Task "Setup PostgreSQL replication and failover" has been moved to In Review by Priya Sharma',
        relatedTaskId: t2_2.id,
        isRead: false,
        createdAt: minsAgo(45),
      },
      {
        userId: pm2.id,
        type: NotificationType.TASK_MOVED_TO_REVIEW,
        message: 'Task "Implement vector similarity embedding index" has been moved to In Review by Ravi Kumar',
        relatedTaskId: t3_2.id,
        isRead: false,
        createdAt: minsAgo(120),
      },
      {
        userId: pm2.id,
        type: NotificationType.TASK_MOVED_TO_REVIEW,
        message: 'Task "Calibrate cold-chain temperature threshold alerts" has been moved to In Review by Kavya Reddy',
        relatedTaskId: t4_3.id,
        isRead: false,
        createdAt: minsAgo(75),
      },
      {
        userId: pm1.id,
        type: NotificationType.TASK_MOVED_TO_REVIEW,
        message: 'Task "Audit HIPAA access log retention compliance" has been moved to In Review by Arjun Mehta',
        relatedTaskId: t5_4.id,
        isRead: false,
        createdAt: hoursAgo(4),
      },
    ],
  });

  console.log("[Seed] Completed successfully!");
  console.log("====================================================================");
  console.log("  EXPANDED DEMO LOGIN CREDENTIALS:");
  console.log("  Password for all accounts: Password123!");
  console.log("  Admin:             admin@velozity.com     (Rajesh Verma)");
  console.log("  Project Manager 1: neha.pm@velozity.com    (Neha Sharma)");
  console.log("  Project Manager 2: rohan.pm@velozity.com   (Rohan Kulkarni)");
  console.log("  Developer 1:       ravi.dev@velozity.com   (Ravi Kumar)");
  console.log("  Developer 2:       priya.dev@velozity.com  (Priya Sharma)");
  console.log("  Developer 3:       arjun.dev@velozity.com  (Arjun Mehta)");
  console.log("  Developer 4:       kavya.dev@velozity.com  (Kavya Reddy)");
  console.log("  Developer 5:       siddharth.dev@velozity.com (Siddharth Nair)");
  console.log("  Developer 6:       ananya.dev@velozity.com (Ananya Iyer)");
  console.log("====================================================================");
}

main()
  .catch((e) => {
    console.error("[Seed] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
