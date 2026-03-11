# from backend_app.config import settings
# from backend_app.exports import gotenberg_html_to_pdf_bytes


# def test_gotenberg_html_to_pdf_bytes_smoke():
#     pdf = gotenberg_html_to_pdf_bytes(
#         settings.gotenberg_url,
#         "<html><body><h1>Hello</h1><p>PDF test</p></body></html>",
#     )
#     assert isinstance(pdf, (bytes, bytearray))
#     # PDF files start with "%PDF-"
#     assert pdf[:5] == b"%PDF-"
