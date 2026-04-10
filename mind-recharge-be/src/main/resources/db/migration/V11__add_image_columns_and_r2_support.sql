ALTER TABLE users
ADD avatar_url VARCHAR(1000),
    avatar_key VARCHAR(500);

ALTER TABLE unsent_messages
ADD image_url VARCHAR(1000),
    image_key VARCHAR(500);
