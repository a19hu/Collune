"""Small, cached proxy for GeoNames address dropdown data.

The GeoNames username remains server-side; browsers only call this endpoint.
"""

from functools import lru_cache
import os

import requests
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


GEONAMES_URL = "https://secure.geonames.org"


@lru_cache(maxsize=512)
def _geonames(path, params_key):
    username = os.environ.get("GEONAMES_USERNAME", "collune").strip()
    if not username:
        raise RuntimeError("GeoNames is not configured.")
    params = dict(params_key)
    params["username"] = username
    response = requests.get(f"{GEONAMES_URL}/{path}", params=params, timeout=8)
    response.raise_for_status()
    payload = response.json()
    if payload.get("status"):
        raise RuntimeError(payload["status"].get("message", "GeoNames request failed."))
    return payload


def _search(country, feature_code, admin_code=""):
    params = {"country": country, "featureCode": feature_code, "maxRows": "1000", "style": "SHORT"}
    if admin_code:
        params["adminCode1"] = admin_code
    payload = _geonames("searchJSON", tuple(sorted(params.items())))
    return sorted(
        [
            {
                "id": str(item.get("geonameId", "")),
                "name": item.get("name", ""),
                "code": item.get("adminCode1", ""),
            }
            for item in payload.get("geonames", [])
            if item.get("name")
        ],
        key=lambda item: item["name"],
    )


class GeoNamesLocationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        level = request.query_params.get("level", "countries")
        country = request.query_params.get("country", "").upper().strip()
        state_code = request.query_params.get("state", "").strip()
        try:
            if level == "countries":
                payload = _geonames("countryInfoJSON", tuple())
                locations = sorted(
                    [
                        {"id": str(item.get("geonameId", "")), "name": item.get("countryName", ""), "code": item.get("countryCode", "")}
                        for item in payload.get("geonames", [])
                        if item.get("countryName") and item.get("countryCode")
                    ],
                    key=lambda item: item["name"],
                )
            elif level == "states" and country:
                locations = _search(country, "ADM1")
            elif level == "districts" and country and state_code:
                locations = _search(country, "ADM2", state_code)
            else:
                return Response({"error": "A valid location level and parent selection are required."}, status=status.HTTP_400_BAD_REQUEST)
        except (requests.RequestException, RuntimeError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"locations": locations})
