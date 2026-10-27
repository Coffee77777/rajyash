-- Rajyash v1 database (separate from any other project)
-- Target: MySQL 8, utf8mb4. Draft; refine during build.

CREATE DATABASE IF NOT EXISTS rajyash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rajyash;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone         VARCHAR(15) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  role          ENUM('admin','driver','requester') NOT NULL,
  language      ENUM('en','hi','gu') NOT NULL DEFAULT 'en',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  user_id          INT UNSIGNED PRIMARY KEY,
  vehicle_number   VARCHAR(20) NOT NULL,
  rate_per_km      DECIMAL(6,2) NOT NULL DEFAULT 12.00,
  minimum_fare     DECIMAL(6,2) NOT NULL DEFAULT 40.00,
  is_online        TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE donors (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(160) NOT NULL,
  address       VARCHAR(255) NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  phone         VARCHAR(15),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drop_points (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(160) NOT NULL,
  address       VARCHAR(255) NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  is_active     TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donor_id      INT UNSIGNED NOT NULL,
  requested_by  INT UNSIGNED NOT NULL,
  food_type     VARCHAR(80) NOT NULL,
  approx_kg     DECIMAL(6,2),
  ready_by      DATETIME NOT NULL,
  pickup_address VARCHAR(255) NOT NULL,
  status        ENUM('requested','under_review','assigned','accepted','declined',
                     'ride_started','picked_up','delivered','closed','cancelled')
                NOT NULL DEFAULT 'requested',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE trips (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id      INT UNSIGNED NOT NULL UNIQUE,
  driver_id       INT UNSIGNED,
  drop_point_id   INT UNSIGNED,
  pickup_kg       DECIMAL(6,2),
  delivered_kg    DECIMAL(6,2),
  km_gps          DECIMAL(7,2),
  km_manual       DECIMAL(7,2),
  km_reason       VARCHAR(255),
  fare            DECIMAL(8,2),
  started_at      DATETIME,
  closed_at       DATETIME,
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (drop_point_id) REFERENCES drop_points(id)
);

CREATE TABLE trip_events (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id     INT UNSIGNED NOT NULL,
  status      VARCHAR(30) NOT NULL,
  actor_id    INT UNSIGNED NOT NULL,
  note        VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE gps_points (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id     INT UNSIGNED NOT NULL,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  recorded_at DATETIME NOT NULL,
  INDEX (trip_id, recorded_at),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE photos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id     INT UNSIGNED NOT NULL,
  kind        ENUM('pickup','drop') NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE payouts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  driver_id     INT UNSIGNED NOT NULL,
  period_month  CHAR(7) NOT NULL,           -- e.g. 2026-11
  trips_count   INT UNSIGNED NOT NULL DEFAULT 0,
  total_km      DECIMAL(9,2) NOT NULL DEFAULT 0,
  amount_due    DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus         DECIMAL(10,2) NOT NULL DEFAULT 0,
  deduction     DECIMAL(10,2) NOT NULL DEFAULT 0,
  status        ENUM('draft','approved','paid') NOT NULL DEFAULT 'draft',
  upi_reference VARCHAR(80),
  paid_at       DATETIME,
  UNIQUE KEY (driver_id, period_month),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

CREATE TABLE audit_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT UNSIGNED NOT NULL,
  action      VARCHAR(80) NOT NULL,
  entity      VARCHAR(40) NOT NULL,
  entity_id   INT UNSIGNED,
  detail      JSON,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
