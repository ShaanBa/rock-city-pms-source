-- Development/demo seed. Do not use this file as a production inventory backup.
TRUNCATE TABLE rooms CASCADE;

INSERT INTO
    rooms (
        "id",
        "RoomNumber",
        "RoomType",
        "BasePrice",
        "IsSmoking",
        "CleanStatus",
        "PriorityTier",
        "ConditionNotes"
    )
VALUES (
        1,
        14,
        'King',
        80 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        2,
        15,
        'Double',
        75 / 1.135,
        FALSE,
        'NotRented',
        3,
        'Demo out-of-service room'
    ),
    (
        3,
        16,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        4,
        17,
        'Family',
        130 / 1.135,
        FALSE,
        'Clean',
        1,
        'Demo family layout'
    ),
    (
        5,
        18,
        'Double',
        75 / 1.135,
        FALSE,
        'NotRented',
        3,
        'Demo out-of-service room'
    ),
    (
        6,
        19,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        7,
        20,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        3,
        NULL
    ),
    (
        8,
        21,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        2,
        NULL
    ),
    (
        9,
        22,
        'Double',
        75 / 1.135,
        TRUE,
        'Clean',
        1,
        NULL
    ),
    (
        10,
        23,
        'King',
        80 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        11,
        24,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        12,
        25,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        13,
        26,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        14,
        27,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        15,
        28,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        2,
        NULL
    ),
    (
        16,
        29,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    ),
    (
        17,
        30,
        'Double',
        75 / 1.135,
        FALSE,
        'Clean',
        1,
        NULL
    );
