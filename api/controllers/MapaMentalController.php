<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class MapaMentalController {
    private $mapa;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->mapa = new MapaMental($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->mapa->read($id_usuario);
        
        $mapas = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['nos'] = json_decode($row['nos']);
            $row['conexoes'] = json_decode($row['conexoes']);
            array_push($mapas, $row);
        }
        
        echo json_encode($mapas);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->mapa->id_mapa = $id;
        $this->mapa->id_usuario = $id_usuario;
        
        if($this->mapa->readOne()) {
            echo json_encode([
                "id_mapa" => $this->mapa->id_mapa,
                "id_usuario" => $this->mapa->id_usuario,
                "titulo" => $this->mapa->titulo,
                "data" => $this->mapa->data,
                "nos" => json_decode($this->mapa->nos),
                "conexoes" => json_decode($this->mapa->conexoes)
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Mapa mental não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->titulo)) {
            http_response_code(400);
            echo json_encode(["message" => "Título é obrigatório"]);
            return;
        }
        
        $this->mapa->id_usuario = $id_usuario;
        $this->mapa->titulo = $data->titulo;
        $this->mapa->data = $data->data ?? date('Y-m-d H:i:s');
        $this->mapa->nos = isset($data->nos) ? json_encode($data->nos) : '[]';
        $this->mapa->conexoes = isset($data->conexoes) ? json_encode($data->conexoes) : '[]';
        
        if($this->mapa->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Mapa mental criado com sucesso",
                "id_mapa" => $this->mapa->id_mapa
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar mapa mental."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->mapa->id_mapa = $id;
        $this->mapa->id_usuario = $id_usuario;
        
        if(!$this->mapa->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Mapa mental não encontrado"]);
            return;
        }
        
        $this->mapa->titulo = $data->titulo ?? $this->mapa->titulo;
        $this->mapa->data = $data->data ?? date('Y-m-d H:i:s');
        $this->mapa->nos = isset($data->nos) ? json_encode($data->nos) : $this->mapa->nos;
        $this->mapa->conexoes = isset($data->conexoes) ? json_encode($data->conexoes) : $this->mapa->conexoes;
        
        if($this->mapa->update()) {
            echo json_encode(["message" => "Mapa mental updated com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar mapa mental"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->mapa->id_mapa = $id;
        $this->mapa->id_usuario = $id_usuario;
        
        if($this->mapa->delete()) {
            echo json_encode(["message" => "Mapa mental deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar mapa mental"]);
        }
    }
}
?>
