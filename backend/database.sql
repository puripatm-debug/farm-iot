-- =====================================================
-- IoT Farm Management System - Actual Database Schema
-- Source: DataGrip export (production DB: 66122420101)
-- =====================================================

-- 1. user_roles
create table if not exists user_roles
(
    id         bigint unsigned auto_increment primary key,
    name       varchar(255) not null,
    created_at timestamp    null,
    updated_at timestamp    null,
    deleted_at timestamp    null
) collate = utf8mb4_unicode_ci;

-- 2. users
create table if not exists users
(
    id           bigint unsigned auto_increment primary key,
    user_role_id bigint unsigned null,
    username     varchar(255)    not null,
    password     varchar(255)    not null,
    google       varchar(255)    null,
    email        varchar(255)    null,
    last_login   timestamp       null,
    tel          varchar(20)     null,
    address      text            null,
    birth_date   date            null,
    firstname    varchar(255)    null,
    lastname     varchar(255)    null,
    created_at   timestamp       null,
    updated_at   timestamp       null,
    deleted_at   timestamp       null,
    constraint users_email_unique unique (email),
    constraint users_username_unique unique (username),
    constraint users_user_role_id_foreign
        foreign key (user_role_id) references user_roles (id)
            on update cascade on delete set null
) collate = utf8mb4_unicode_ci;

-- 3. farm_categories
create table if not exists farm_categories
(
    id         bigint unsigned auto_increment primary key,
    cat_name   varchar(255) not null,
    created_at timestamp    null,
    updated_at timestamp    null,
    deleted_at timestamp    null
) collate = utf8mb4_unicode_ci;

-- 4. farms
create table if not exists farms
(
    id               bigint unsigned auto_increment primary key,
    farm_category_id bigint unsigned not null,
    lat              decimal(10, 8)  null,
    lng              decimal(11, 8)  null,
    name             varchar(255)    not null,
    description      text            null,
    size             double          null,
    farm_prefix      varchar(50)     null,
    created_at       timestamp       null,
    updated_at       timestamp       null,
    deleted_at       timestamp       null,
    constraint farms_farm_category_id_foreign
        foreign key (farm_category_id) references farm_categories (id)
) collate = utf8mb4_unicode_ci;

-- 5. user_farms
create table if not exists user_farms
(
    id         bigint unsigned auto_increment primary key,
    user_id    bigint unsigned not null,
    farm_id    bigint unsigned not null,
    created_at timestamp       null,
    updated_at timestamp       null,
    deleted_at timestamp       null,
    constraint user_farms_farm_id_foreign foreign key (farm_id) references farms (id),
    constraint user_farms_user_id_foreign foreign key (user_id) references users (id)
) collate = utf8mb4_unicode_ci;

-- 6. iot_devices
create table if not exists iot_devices
(
    id          bigint unsigned auto_increment primary key,
    uuid        varchar(45)          not null,
    farm_id     bigint unsigned      not null,
    description text                 null,
    status      tinyint(1) default 1 not null,
    unit        varchar(50)          null,
    created_at  timestamp            null,
    updated_at  timestamp            null,
    deleted_at  timestamp            null,
    constraint iot_devices_uuid_unique unique (uuid),
    constraint iot_devices_farm_id_foreign foreign key (farm_id) references farms (id)
) collate = utf8mb4_unicode_ci;

-- 7. sensor_types
create table if not exists sensor_types
(
    id          int unsigned auto_increment primary key,
    type_name   varchar(100) not null,
    unit        varchar(20)  not null,
    description varchar(255) null,
    created_at  timestamp    null,
    updated_at  timestamp    null,
    deleted_at  timestamp    null
) collate = utf8mb4_unicode_ci;

-- 8. sensor_data
create table if not exists sensor_data
(
    id             bigint unsigned auto_increment primary key,
    uuid           varchar(45)    not null,
    sensor_prefix  varchar(50)    null,
    val            decimal(10, 2) not null,
    sensor_type_id int unsigned   not null,
    created_at     timestamp      null,
    updated_at     timestamp      null,
    deleted_at     timestamp      null,
    constraint sensor_data_sensor_type_id_foreign foreign key (sensor_type_id) references sensor_types (id),
    constraint sensor_data_uuid_foreign foreign key (uuid) references iot_devices (uuid)
) collate = utf8mb4_unicode_ci;

-- 9. actuator_commands
create table if not exists actuator_commands
(
    id              int unsigned auto_increment primary key,
    uuid            varchar(45) not null,
    auto_rule_id    int         null,
    actuator_prefix varchar(50) null,
    pin             int         null,
    val             varchar(50) null,
    created_at      timestamp   null,
    updated_at      timestamp   null,
    deleted_at      timestamp   null,
    constraint actuator_commands_uuid_foreign foreign key (uuid) references iot_devices (uuid)
) collate = utf8mb4_unicode_ci;

-- 10. auto_rules
create table if not exists auto_rules
(
    id                       bigint unsigned auto_increment primary key,
    farm_id                  bigint unsigned      not null,
    description              varchar(255)         null,
    sensor_type_id           int unsigned         not null,
    operator                 varchar(10)          not null,
    threshold                decimal(8, 2)        not null,
    actuator_iot_device_uuid varchar(45)          not null,
    actuator_prefix          varchar(50)          not null,
    actuator_pin             int                  not null,
    actuator_command_val     varchar(50)          not null,
    is_active                tinyint(1) default 1 not null,
    created_at               timestamp            null,
    updated_at               timestamp            null,
    deleted_at               timestamp            null,
    constraint auto_rules_actuator_iot_device_uuid_foreign
        foreign key (actuator_iot_device_uuid) references iot_devices (uuid),
    constraint auto_rules_farm_id_foreign
        foreign key (farm_id) references farms (id) on delete cascade,
    constraint auto_rules_sensor_type_id_foreign
        foreign key (sensor_type_id) references sensor_types (id)
) collate = utf8mb4_unicode_ci;

-- =====================================================
-- Seed data
-- =====================================================
insert ignore into user_roles (id, name) values (1, 'admin'), (2, 'user');

insert ignore into farm_categories (id, cat_name) values
(1, 'ไร่/สวน'), (2, 'นาข้าว'), (3, 'โรงเรือน'), (4, 'ปศุสัตว์'), (5, 'อื่นๆ');

insert ignore into sensor_types (id, type_name, unit, description) values
(1, 'Temperature', '°C', 'อุณหภูมิ'),
(2, 'Humidity', '%', 'ความชื้นอากาศ'),
(3, 'Soil Moisture', '%', 'ความชื้นดิน'),
(4, 'Light', 'lux', 'ความเข้มแสง'),
(5, 'CO2', 'ppm', 'ความเข้มข้น CO2');
