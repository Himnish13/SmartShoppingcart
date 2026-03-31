CREATE DATABASE IF NOT EXISTS Main_Server;
USE Main_Server;
-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: Main_Server
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `beacons`
--

DROP TABLE IF EXISTS `beacons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beacons` (
  `beacon_id` varchar(50) NOT NULL,
  `node_id` int DEFAULT NULL,
  `tx_power` int DEFAULT NULL,
  `installed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`beacon_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `beacons_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beacons`
--

LOCK TABLES `beacons` WRITE;
/*!40000 ALTER TABLE `beacons` DISABLE KEYS */;
/*!40000 ALTER TABLE `beacons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_devices`
--

DROP TABLE IF EXISTS `cart_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_devices` (
  `cart_id` varchar(50) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `last_seen` timestamp NULL DEFAULT NULL,
  `firmware_version` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_devices`
--

LOCK TABLES `cart_devices` WRITE;
/*!40000 ALTER TABLE `cart_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_session`
--

DROP TABLE IF EXISTS `cart_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_session` (
  `session_id` varchar(50) NOT NULL,
  `cart_id` varchar(50) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `cart_id` (`cart_id`),
  CONSTRAINT `cart_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `cart_session_ibfk_2` FOREIGN KEY (`cart_id`) REFERENCES `cart_devices` (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_session`
--

LOCK TABLES `cart_session` WRITE;
/*!40000 ALTER TABLE `cart_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crowd_data`
--

DROP TABLE IF EXISTS `crowd_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crowd_data` (
  `node_id` int NOT NULL,
  `crowd_level` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crowd_data`
--

LOCK TABLES `crowd_data` WRITE;
/*!40000 ALTER TABLE `crowd_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `crowd_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `edges`
--

DROP TABLE IF EXISTS `edges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `edges` (
  `from_node` int NOT NULL,
  `to_node` int NOT NULL,
  `distance` float DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`from_node`,`to_node`),
  KEY `to_node` (`to_node`),
  CONSTRAINT `edges_ibfk_1` FOREIGN KEY (`from_node`) REFERENCES `nodes` (`node_id`),
  CONSTRAINT `edges_ibfk_2` FOREIGN KEY (`to_node`) REFERENCES `nodes` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `edges`
--

LOCK TABLES `edges` WRITE;
/*!40000 ALTER TABLE `edges` DISABLE KEYS */;
/*!40000 ALTER TABLE `edges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nodes` (
  `node_id` int NOT NULL,
  `x_coordinate` int DEFAULT NULL,
  `y_coordinate` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nodes`
--

LOCK TABLES `nodes` WRITE;
/*!40000 ALTER TABLE `nodes` DISABLE KEYS */;
/*!40000 ALTER TABLE `nodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `product_id` int NOT NULL,
  `discount_percent` float DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product_mastery` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT NULL,
  `price_at_time` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`order_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product_mastery` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `cart_id` varchar(50) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `cart_id` (`cart_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`cart_id`) REFERENCES `cart_devices` (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_location`
--

DROP TABLE IF EXISTS `product_location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_location` (
  `product_id` int NOT NULL,
  `node_id` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `product_location_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product_mastery` (`product_id`),
  CONSTRAINT `product_location_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_location`
--

LOCK TABLES `product_location` WRITE;
/*!40000 ALTER TABLE `product_location` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_mastery`
--

DROP TABLE IF EXISTS `product_mastery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_mastery` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `barcode` varchar(50) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_mastery`
--

LOCK TABLES `product_mastery` WRITE;
/*!40000 ALTER TABLE `product_mastery` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_mastery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_meta`
--

DROP TABLE IF EXISTS `sync_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_meta` (
  `table_name` varchar(100) NOT NULL,
  `last_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_meta`
--

LOCK TABLES `sync_meta` WRITE;
/*!40000 ALTER TABLE `sync_meta` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(15) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('CUSTOMER','STAFF','ADMIN') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-18 15:29:12
