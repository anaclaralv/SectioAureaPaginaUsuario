<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class HistoricoLeituraController {
    private $leitura;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->leitura = new HistoricoLeitura($db);
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
        $stmt = $this->leitura->read($id_usuario);
        
        $leituras = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['paginas'] = json_decode($row['paginas']) ?? [];
            $row['anotacoes'] = json_decode($row['anotacoes']) ?? [];
            
            // Aliases para o frontend
            $row['trechos'] = $row['paginas'];
            $row['textoCompleto'] = $row['texto_completo'] ?? '';
            
            array_push($leituras, $row);
        }
        
        echo json_encode($leituras);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->leitura->id_leitura = $id;
        $this->leitura->id_usuario = $id_usuario;
        
        if($this->leitura->readOne()) {
            $paginas = json_decode($this->leitura->paginas) ?? [];
            $anotacoes = json_decode($this->leitura->anotacoes) ?? [];
            
            echo json_encode([
                "id_leitura" => $this->leitura->id_leitura,
                "id_usuario" => $this->leitura->id_usuario,
                "titulo" => $this->leitura->titulo,
                "data" => $this->leitura->data,
                "paginas" => $paginas,
                "trechos" => $paginas, // alias
                "anotacoes" => $anotacoes,
                "texto_completo" => $this->leitura->texto_completo,
                "textoCompleto" => $this->leitura->texto_completo // alias
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Leitura não encontrada"]);
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
        
        $this->leitura->id_usuario = $id_usuario;
        $this->leitura->titulo = $data->titulo;
        
        $data_leitura = $data->data ?? date('Y-m-d H:i:s');
        $timestamp = strtotime($data_leitura);
        $this->leitura->data = ($timestamp !== false) ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
        
        // Mapeia trechos para paginas
        $this->leitura->paginas = isset($data->trechos) ? json_encode($data->trechos) : (isset($data->paginas) ? json_encode($data->paginas) : '[]');
        $this->leitura->anotacoes = isset($data->anotacoes) ? json_encode($data->anotacoes) : '[]';
        $this->leitura->texto_completo = $data->textoCompleto ?? '';
        
        if($this->leitura->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Leitura registrada com sucesso",
                "id_leitura" => $this->leitura->id_leitura
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao registrar leitura."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->leitura->id_leitura = $id;
        $this->leitura->id_usuario = $id_usuario;
        
        if(!$this->leitura->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Leitura não encontrada"]);
            return;
        }
        
        $this->leitura->titulo = $data->titulo ?? $this->leitura->titulo;
        $this->leitura->paginas = isset($data->trechos) ? json_encode($data->trechos) : (isset($data->paginas) ? json_encode($data->paginas) : $this->leitura->paginas);
        $this->leitura->anotacoes = isset($data->anotacoes) ? json_encode($data->anotacoes) : $this->leitura->anotacoes;
        $this->leitura->texto_completo = $data->textoCompleto ?? $this->leitura->texto_completo;
        
        if($this->leitura->update()) {
            echo json_encode(["message" => "Leitura atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar leitura."]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->leitura->id_leitura = $id;
        $this->leitura->id_usuario = $id_usuario;
        
        if($this->leitura->delete()) {
            echo json_encode(["message" => "Leitura deletada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar leitura."]);
        }
    }
}
?>
