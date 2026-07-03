"""تسجيل طلبية مؤكدة من الطرفية (لحين ربط نظام الطلبات الكامل).

الاستخدام:
    python order_cli.py 9725XXXXXXXX 149            ← تأكيد طلبية (يرسل CAPI)
    python order_cli.py --delivered 12              ← وصلت واستلمتها الزبونة
    python order_cli.py --rejected 12               ← رفض استلام
"""
import sys

import capi
import db


def main(argv: list[str]) -> None:
    db.init()
    if argv[0] == "--delivered":
        capi.mark_delivery(int(argv[1]), delivered=True)
        print(f"order {argv[1]}: delivered")
    elif argv[0] == "--rejected":
        capi.mark_delivery(int(argv[1]), delivered=False)
        print(f"order {argv[1]}: rejected")
    else:
        phone, value = argv[0], float(argv[1])
        result = capi.record_order_and_send(phone, value)
        print(result)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1:])
