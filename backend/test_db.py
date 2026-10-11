from utils.database import get_db_connection


def main():
    connection = None

    try:
        connection = get_db_connection()

        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS database_name")
            result = cursor.fetchone()

        print("Database connection successful!")
        print("Connected database:", result["database_name"])

    except Exception as error:
        print("Database connection failed:", error)

    finally:
        if connection is not None:
            connection.close()


if __name__ == "__main__":
    main()